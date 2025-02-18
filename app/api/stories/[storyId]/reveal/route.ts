import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { pusherServer } from '@/lib/pusher'

export async function POST(
  request: Request,
  { params }: { params: { storyId: string } }
) {
  const session = await getServerSession(authOptions)
  const { participantId } = await request.json()
  const storyId = params.storyId

  try {
    // Verificar se é um usuário autenticado ou um participante anônimo
    if (!session?.user?.id && !participantId) {
      return new NextResponse('Usuário não autorizado', { status: 401 })
    }

    // Se for participante anônimo, verificar se ele existe
    if (participantId) {
      const participant = await prisma.anonymousParticipant.findUnique({
        where: { id: participantId }
      })

      if (!participant) {
        return new NextResponse('Participante não encontrado', { status: 404 })
      }
    }

    // Atualizar a história para revelar os votos
    const story = await prisma.story.update({
      where: { id: storyId },
      data: { revealed: true }
    })

    // Enviar evento em tempo real
    await pusherServer.trigger(
      `room-${story.roomId}`,
      'reveal',
      { revealed: true }
    )

    return NextResponse.json(story)
  } catch (error) {
    console.error('Erro ao revelar votos:', error)
    return new NextResponse('Erro ao revelar votos', { status: 500 })
  }
} 