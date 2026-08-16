import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  buildRoomSnapshot,
  ensureCurrentStory,
  publishRoomState,
} from "@/lib/room-state";
import { resolveParticipant } from "@/lib/participant";

/**
 * Fonte de verdade do estado da sala.
 *
 * O cliente chama isto ao montar, ao reconectar, ao voltar para a aba e num
 * poll de segurança. É o que torna o tempo real auto-recuperável: qualquer
 * evento perdido é corrigido na próxima reconciliação.
 */
export async function GET(
  request: Request,
  props: { params: Promise<{ roomId: string }> }
) {
  const { roomId } = await props.params;

  try {
    const room = await prisma.room.findUnique({ where: { id: roomId } });

    if (!room) {
      return NextResponse.json({ error: "Sala não encontrada" }, { status: 404 });
    }

    if (room.expiresAt < new Date()) {
      return NextResponse.json({ error: "Sala expirada" }, { status: 410 });
    }

    await ensureCurrentStory(roomId);

    // Aproveita a leitura para renovar a presença de quem está pedindo,
    // sem gastar uma requisição só para isso.
    const participant = await resolveParticipant(request, roomId);
    let cameBackOnline = false;

    if (participant) {
      cameBackOnline = !participant.isOnline;
      await prisma.participant.update({
        where: { id: participant.id },
        data: { isOnline: true, lastSeenAt: new Date() },
      });
    }

    // Voltar a ficar online é uma mudança de estado como outra qualquer: precisa
    // de uma versão nova, senão o próprio cliente descartaria este snapshot por
    // ser "igual ao que já tenho" e continuaria se exibindo como ausente. Isso
    // acontece de verdade com duas abas: fechar uma marca a pessoa offline para
    // o mesmo clientId, e é esta linha que conserta na outra.
    const snapshot = cameBackOnline
      ? await publishRoomState(roomId)
      : await buildRoomSnapshot(roomId);

    // O snapshot esconde o valor dos votos até a revelação, mas você sempre
    // pode ver o *seu*. Ele vai aqui, na resposta individual, e não no
    // broadcast — que é o mesmo para todo mundo.
    let yourVote: string | null = null;

    if (participant && snapshot?.story) {
      const own = await prisma.vote.findUnique({
        where: {
          participantId_storyId: {
            participantId: participant.id,
            storyId: snapshot.story.id,
          },
        },
        select: { value: true },
      });
      yourVote = own?.value ?? null;
    }

    return NextResponse.json(
      { snapshot, you: participant?.id ?? null, yourVote },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("[state] erro ao montar snapshot", error);
    return NextResponse.json(
      { error: "Erro ao carregar o estado da sala" },
      { status: 500 }
    );
  }
}
