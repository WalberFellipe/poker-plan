import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveParticipant } from "@/lib/participant";
import { publishRoomState } from "@/lib/room-state";

/**
 * Sair da sala é *soft*: marca offline e preserva a linha e os votos.
 *
 * A versão anterior deletava o participante, o que fazia um simples reload
 * apagar a pessoa (e, por tabela, invalidar os votos dela) — origem dos bugs de
 * duplicação e de voto perdido.
 */
export async function POST(
  request: Request,
  props: { params: Promise<{ roomId: string }> }
) {
  const { roomId } = await props.params;

  try {
    const participant = await resolveParticipant(request, roomId);

    if (!participant) {
      return NextResponse.json({ success: true });
    }

    await prisma.participant.update({
      where: { id: participant.id },
      data: { isOnline: false, lastSeenAt: new Date() },
    });

    await publishRoomState(roomId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[leave] erro ao sair da sala", error);
    return NextResponse.json({ error: "Erro ao sair da sala" }, { status: 500 });
  }
}
