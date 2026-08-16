import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CLIENT_ID_HEADER } from "@/types/room-state";
import type { Participant } from "@prisma/client";

/**
 * Identidade do participante.
 *
 * O bug de duplicação vinha de o `join` sempre criar uma linha nova e de o
 * cliente nunca reler o id que já tinha guardado. A correção tem duas metades:
 * o browser mantém um `clientId` estável em localStorage, e o servidor trata
 * (roomId, clientId) como chave — entrar de novo reencontra a mesma linha em
 * vez de criar outra. Nada aqui apaga participante: sair só marca offline.
 */

export function readClientId(request: Request): string | null {
  const fromHeader = request.headers.get(CLIENT_ID_HEADER);
  if (fromHeader && fromHeader.trim() !== "") return fromHeader.trim();

  // `navigator.sendBeacon` (usado no fechamento da aba) não permite headers
  // customizados, então o id também é aceito na query string.
  try {
    const fromQuery = new URL(request.url).searchParams.get("clientId");
    if (fromQuery && fromQuery.trim() !== "") return fromQuery.trim();
  } catch {
    // URL malformada: seguimos sem id.
  }

  return null;
}

/**
 * Encontra o participante que está fazendo a requisição, sem criá-lo.
 * Retorna null quando quem chama ainda não entrou na sala.
 */
export async function resolveParticipant(
  request: Request,
  roomId: string
): Promise<Participant | null> {
  const session = await getServerSession(authOptions);
  const clientId = readClientId(request);
  const userId = session?.user?.id;

  if (!userId && !clientId) return null;

  // Uma query só, não duas: cada ida ao banco custa ~200ms de rede, e este
  // caminho roda em toda mutação. A cadeira autenticada tem prioridade quando
  // as duas existirem.
  const candidates = await prisma.participant.findMany({
    where: {
      roomId,
      OR: [
        ...(userId ? [{ userId }] : []),
        ...(clientId ? [{ clientId }] : []),
      ],
    },
    take: 2,
  });

  if (candidates.length === 0) return null;

  return (
    candidates.find((candidate) => userId && candidate.userId === userId) ??
    candidates[0]
  );
}

/**
 * Encontra ou cria o participante de forma idempotente.
 *
 * Chamar duas vezes com o mesmo `clientId` devolve a mesma linha — é o que
 * torna seguro o cliente chamar `join` em toda montagem da página.
 */
export async function ensureParticipant(
  request: Request,
  roomId: string,
  fallbackName?: string | null
): Promise<Participant | null> {
  const session = await getServerSession(authOptions);
  const clientId = readClientId(request);

  if (session?.user?.id) {
    const userId = session.user.id;
    const name = session.user.name ?? fallbackName ?? "Anônimo";
    const image = session.user.image ?? null;

    // Se esta pessoa já estava na sala como convidada neste mesmo browser,
    // promovemos a linha existente em vez de criar uma segunda cadeira.
    if (clientId) {
      const existingGuest = await prisma.participant.findUnique({
        where: { roomId_clientId: { roomId, clientId } },
      });

      if (existingGuest && existingGuest.userId === null) {
        const alreadyAuthenticated = await prisma.participant.findUnique({
          where: { roomId_userId: { roomId, userId } },
        });

        if (!alreadyAuthenticated) {
          return prisma.participant.update({
            where: { id: existingGuest.id },
            data: { userId, name, image, isOnline: true, lastSeenAt: new Date() },
          });
        }

        // Já existe a cadeira autenticada: descarta a de convidado para não
        // deixar a pessoa duplicada na mesa.
        await prisma.participant.delete({ where: { id: existingGuest.id } });
        return prisma.participant.update({
          where: { id: alreadyAuthenticated.id },
          data: { isOnline: true, lastSeenAt: new Date(), name, image },
        });
      }
    }

    return prisma.participant.upsert({
      where: { roomId_userId: { roomId, userId } },
      update: { isOnline: true, lastSeenAt: new Date(), name, image },
      create: {
        roomId,
        userId,
        clientId: clientId ?? `user:${userId}`,
        name,
        image,
      },
    });
  }

  if (!clientId) return null;

  const name = fallbackName?.trim() || "Anônimo";

  return prisma.participant.upsert({
    where: { roomId_clientId: { roomId, clientId } },
    update: {
      isOnline: true,
      lastSeenAt: new Date(),
      // Só sobrescreve o nome quando um novo foi informado de fato, para que
      // um join de reconexão não renomeie alguém para "Anônimo".
      ...(fallbackName?.trim() ? { name: fallbackName.trim() } : {}),
    },
    create: { roomId, clientId, name },
  });
}
