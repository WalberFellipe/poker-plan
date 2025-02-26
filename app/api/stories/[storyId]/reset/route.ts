import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { pusher } from '@/lib/pusher'

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

    // Buscar a história atual para pegar o roomId
    const currentStory = await prisma.story.findUnique({
      where: { id: storyId }
    })

    if (!currentStory) {
      return new NextResponse('História não encontrada', { status: 404 })
    }

    // Criar nova história
    const newStory = await prisma.story.create({
      data: {
        title: 'Nova História',
        roomId: currentStory.roomId,
        revealed: false
      }
    })

    // Notificar todos os participantes sobre a nova história
    await pusher.trigger(`room-${currentStory.roomId}`, 'story:reset', {
      oldStoryId: storyId,
      newStoryId: newStory.id
    })

    return NextResponse.json(newStory)
  } catch {
    return new NextResponse('Erro ao resetar história', { status: 500 })
  }
} 