import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveParticipant } from "@/lib/participant";
import { publishRoomState } from "@/lib/room-state";

/**
 * Renova a presença do participante.
 *
 * Só republica o estado quando a pessoa estava marcada como offline e voltou —
 * do contrário um heartbeat periódico geraria uma versão nova a cada poucos
 * segundos e inundaria o canal sem nenhuma mudança real.
 */
export async function POST(
  request: Request,
  props: { params: Promise<{ roomId: string }> }
) {
  const { roomId } = await props.params;

  try {
    const participant = await resolveParticipant(request, roomId);

    if (!participant) {
      return NextResponse.json({ success: false }, { status: 404 });
    }

    const cameBackOnline = !participant.isOnline;

    await prisma.participant.update({
      where: { id: participant.id },
      data: { isOnline: true, lastSeenAt: new Date() },
    });

    if (cameBackOnline) {
      await publishRoomState(roomId);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[heartbeat] erro ao renovar presença", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
