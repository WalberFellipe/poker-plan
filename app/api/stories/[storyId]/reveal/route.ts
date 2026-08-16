import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { resolveParticipant } from '@/lib/participant'
import { publishRoomState } from '@/lib/room-state'
import { REVEAL_COUNTDOWN_MS } from '@/types/room-state'

/**
 * Revelar as cartas.
 *
 * O servidor grava `revealAt` e todos os clientes agendam a virada contra esse
 * instante absoluto, corrigido pelo offset de relógio que vem no snapshot.
 * Antes cada cliente contava 3-2-1 localmente a partir do momento em que
 * recebia o evento, então quem tinha rede mais lenta virava a carta depois.
 *
 * O instante vem de quem clicou, **já convertido para o relógio do servidor**.
 *
 * O cliente conhece o desvio entre os dois relógios (o snapshot carrega
 * `serverNow`), então ele mesmo faz a conversão e manda um instante que já está
 * na nossa base de tempo. Isso mantém uma única origem de tempo e faz o valor
 * autoritativo coincidir com a contagem que já começou na tela de quem clicou.
 *
 * As duas tentativas anteriores erraram de lados opostos: ancorar no relógio do
 * cliente sem converter fazia o desvio entrar duas vezes (e com o servidor
 * adiantado as cartas viravam sem contagem); ancorar na chegada da requisição
 * colocava o instante depois do previsto, e a contagem esticava repetindo
 * dígitos até o servidor alcançar.
 *
 * O valor é limitado a uma janela sã, para um cliente com relógio quebrado — ou
 * mal-intencionado — não conseguir adiar nem antecipar a revelação dos outros.
 */
export async function POST(
  request: Request,
  props: { params: Promise<{ storyId: string }> }
) {
  const { storyId } = await props.params;

  try {
    const body = await request.json().catch(() => ({}));
    const now = Date.now();

    const proposed =
      typeof body?.revealAt === "number" && Number.isFinite(body.revealAt)
        ? body.revealAt
        : now + REVEAL_COUNTDOWN_MS;

    const revealAt = new Date(
      Math.min(Math.max(proposed, now), now + REVEAL_COUNTDOWN_MS)
    );

    const story = await prisma.story.findUnique({
      where: { id: storyId },
      select: { id: true, roomId: true, revealed: true },
    });

    if (!story) {
      return NextResponse.json({ error: "História não encontrada" }, { status: 404 });
    }

    const participant = await resolveParticipant(request, story.roomId);

    if (!participant) {
      return NextResponse.json(
        { error: "Entre na sala antes de revelar" },
        { status: 401 }
      );
    }

    // Já revelada: devolve sucesso sem reagendar. Dois cliques simultâneos em
    // "Revelar" não podem empurrar o revealAt para frente e reiniciar a
    // contagem de quem já estava vendo.
    if (story.revealed) {
      return NextResponse.json({ success: true, alreadyRevealed: true });
    }

    await prisma.story.update({
      where: { id: storyId },
      data: { revealed: true, revealAt },
    });

    const snapshot = await publishRoomState(story.roomId);

    return NextResponse.json({ success: true, snapshot });
  } catch (error) {
    console.error("[reveal] erro ao revelar votos", error);
    return NextResponse.json({ error: "Erro ao revelar votos" }, { status: 500 });
  }
}
