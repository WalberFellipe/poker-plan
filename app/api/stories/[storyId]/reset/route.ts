import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

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

    // Buscar a sala atual
    const currentStory = await prisma.story.findUnique({
      where: { id: storyId },
      select: { roomId: true }
    })

    if (!currentStory) {
      return new NextResponse('História não encontrada', { status: 404 })
    }

    // Criar nova história na mesma sala
    const newStory = await prisma.story.create({
      data: {
        roomId: currentStory.roomId,
        title: 'Nova História',
        revealed: false
      }
    })

    return NextResponse.json(newStory)
  } catch (error) {
    console.error('Erro ao resetar história:', error)
    return new NextResponse('Erro ao resetar história', { status: 500 })
  }
} 