import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { pusher } from "@/lib/pusher"

export async function POST(
  request: Request,
  { params }: { params: { roomId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    const { name } = await request.json()
    const { roomId } = params

    // Verificar se a sala existe
    const room = await prisma.room.findUnique({
      where: { id: roomId }
    })

    if (!room) {
      return NextResponse.json(
        { error: "Sala não encontrada" },
        { status: 404 }
      )
    }

    let participant;

    if (session?.user?.id) {
      // Usuário autenticado
      participant = await prisma.roomParticipant.create({
        data: {
          roomId,
          userId: session.user.id
        },
        include: {
          user: true
        }
      })

      // Notificar outros participantes
      await pusher.trigger(`room-${roomId}`, "participant:join", {
        participantId: participant.id,
        userId: session.user.id,
        name: session.user.name,
        image: session.user.image,
        isAnonymous: false,
      });
    } else {
      // Usuário anônimo
      participant = await prisma.anonymousParticipant.create({
        data: {
          roomId,
          name
        }
      })

      // Notificar outros participantes
      await pusher.trigger(`room-${roomId}`, "participant:join", {
        participantId: participant.id,
        name: participant.name,
        isAnonymous: true,
      });
    }

    return NextResponse.json({ participantId: participant.id })
  } catch {
    return NextResponse.json(
      { error: "Erro ao entrar na sala" },
      { status: 500 }
    )
  }
} 