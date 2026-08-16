import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveParticipant } from "@/lib/participant";
import { publishRoomState } from "@/lib/room-state";
import { REVEAL_COUNTDOWN_MS } from "@/types/room-state";

/**
 * Revelar as cartas.
 *
 * O servidor grava `revealAt = agora + contagem regressiva` e todos os clientes
 * agendam a virada contra esse instante absoluto, corrigido pelo offset de
 * relógio que vem no snapshot. Antes cada cliente contava 3-2-1 localmente a
 * partir do momento em que recebia o evento, então quem tinha rede mais lenta
 * virava a carta depois — o "reveal não é simultâneo".
 */
export async function POST(
  request: Request,
  props: { params: Promise<{ storyId: string }> }
) {
  const { storyId } = await props.params;

  try {
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
      data: {
        revealed: true,
        revealAt: new Date(Date.now() + REVEAL_COUNTDOWN_MS),
      },
    });

    const snapshot = await publishRoomState(story.roomId);

    return NextResponse.json({ success: true, snapshot });
  } catch (error) {
    console.error("[reveal] erro ao revelar votos", error);
    return NextResponse.json({ error: "Erro ao revelar votos" }, { status: 500 });
  }
}
