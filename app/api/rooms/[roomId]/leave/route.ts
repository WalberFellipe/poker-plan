import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { pusher } from '@/lib/pusher'

export async function POST(
  request: Request,
  { params }: { params: { roomId: string } }
) {
  const roomId = await Promise.resolve(params.roomId)
  
  try {
    const { participantId, isAnonymous } = await request.json()

    if (isAnonymous) {
      await prisma.anonymousParticipant.delete({
        where: {
          id: participantId,
          roomId
        }
      })
    } else {
      await prisma.roomParticipant.delete({
        where: {
          id: participantId,
          roomId
        }
      })
    }

    await pusher.trigger(roomId, "participant:leave", {
      participantId,
      isAnonymous,
    });

    return NextResponse.json({ success: true })
  } catch {
    return new NextResponse(
      'Erro ao sair da sala', 
      { status: 500 }
    )
  }
} 