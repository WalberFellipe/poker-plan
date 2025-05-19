import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getPusher } from '@/lib/pusher'

export async function POST(
  request: Request,
  props: { params: Promise<{ roomId: string }> }
) {
  const { roomId } = await props.params;

  try {
    const { participantId, isAnonymous } = await request.json();

    if (isAnonymous) {
      await prisma.anonymousParticipant.delete({
        where: {
          id: participantId,
          roomId,
        },
      });
    } else {
      await prisma.roomParticipant.delete({
        where: {
          id: participantId,
          roomId,
        },
      });
    }

    await getPusher().trigger(roomId, "participant:leave", {
      participantId,
      isAnonymous,
    });

    return NextResponse.json({ success: true });
  } catch {
    return new NextResponse("Erro ao sair da sala", { status: 500 });
  }
} 