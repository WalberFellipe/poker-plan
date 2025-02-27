import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { pusher } from '@/lib/pusher'

export async function POST(
  request: Request,
  props: { params: Promise<{ storyId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const body = await request.json()
    const { participantId } = body
    const storyId = await props.params
    const story = await prisma.story.findUnique({
      where: { id: storyId.storyId },
      include: { room: true },
    });

    
    if (!story) {
      return NextResponse.json(
        { error: "História não encontrada" },
        { status: 404 }
      )
    }

    // Verificar autorização
    if (!session?.user?.id && !participantId) {
      return NextResponse.json(
        { error: "Usuário não autorizado" },
        { status: 401 }
      )
    }

    if (participantId) {
      // Verificar se o participante anônimo existe e pertence à sala
      const participant = await prisma.anonymousParticipant.findFirst({
        where: {
          id: participantId,
          roomId: story.roomId
        }
      })

      if (!participant) {
        return NextResponse.json(
          { error: "Participante não autorizado" },
          { status: 401 }
        )
      }
    }

    // Atualizar história
    await prisma.story.update({
      where: { id: storyId },
      data: { revealed: true }
    })

    // Notificar via Pusher
    await pusher.trigger(`room-${story.roomId}`, "vote:reveal", {
      storyId,
    });

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json(
      { error: "Erro ao revelar votos" },
      { status: 500 }
    )
  }
} 