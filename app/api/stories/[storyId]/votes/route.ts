import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureParticipant } from "@/lib/participant";
import { publishRoomState } from "@/lib/room-state";

/**
 * Registrar voto.
 *
 * `value` é string de propósito: o baralho pode conter "?", "☕", emoji ou
 * tamanhos de camiseta. A conversão numérica só acontece nas estatísticas, e
 * valores não-numéricos simplesmente não entram na média.
 */
export async function POST(
  request: Request,
  props: { params: Promise<{ storyId: string }> }
) {
  const { storyId } = await props.params;

  try {
    const body = await request.json().catch(() => ({}));
    const rawValue = body?.value;

    if (typeof rawValue !== "string" || rawValue.trim() === "") {
      return NextResponse.json({ error: "Valor de voto inválido" }, { status: 400 });
    }

    const value = rawValue.trim();

    const story = await prisma.story.findUnique({
      where: { id: storyId },
      select: { id: true, roomId: true, revealed: true },
    });

    if (!story) {
      return NextResponse.json({ error: "História não encontrada" }, { status: 404 });
    }

    if (story.revealed) {
      return NextResponse.json(
        { error: "A rodada já foi revelada" },
        { status: 409 }
      );
    }

    // `ensure` em vez de `resolve`: se a cadeira sumiu por qualquer motivo, o
    // voto reencontra ou recria o participante em vez de falhar com 401 e
    // sumir silenciosamente — que era exatamente o bug de voto perdido.
    const participant = await ensureParticipant(request, story.roomId, body?.name);

    if (!participant) {
      return NextResponse.json(
        { error: "Entre na sala antes de votar" },
        { status: 401 }
      );
    }

    const vote = await prisma.vote.upsert({
      where: {
        participantId_storyId: { participantId: participant.id, storyId },
      },
      update: { value },
      create: { storyId, participantId: participant.id, value },
    });

    const snapshot = await publishRoomState(story.roomId);

    return NextResponse.json({ success: true, voteId: vote.id, snapshot });
  } catch (error) {
    console.error("[votes] erro ao salvar voto", error);
    return NextResponse.json({ error: "Erro ao salvar voto" }, { status: 500 });
  }
}

/** Remove o próprio voto (desmarcar a carta). */
export async function DELETE(
  request: Request,
  props: { params: Promise<{ storyId: string }> }
) {
  const { storyId } = await props.params;

  try {
    const story = await prisma.story.findUnique({
      where: { id: storyId },
      select: { roomId: true, revealed: true },
    });

    if (!story) {
      return NextResponse.json({ error: "História não encontrada" }, { status: 404 });
    }

    if (story.revealed) {
      return NextResponse.json(
        { error: "A rodada já foi revelada" },
        { status: 409 }
      );
    }

    const participant = await ensureParticipant(request, story.roomId);

    if (!participant) {
      return NextResponse.json({ success: true });
    }

    await prisma.vote.deleteMany({
      where: { participantId: participant.id, storyId },
    });

    const snapshot = await publishRoomState(story.roomId);

    return NextResponse.json({ success: true, snapshot });
  } catch (error) {
    console.error("[votes] erro ao remover voto", error);
    return NextResponse.json({ error: "Erro ao remover voto" }, { status: 500 });
  }
}
