import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(
  request: Request,
  { params }: { params: { roomId: string } }
) {
  const { roomId } = await Promise.resolve(params)
  const session = await getServerSession(authOptions)

  try {
    // Se o usuário estiver logado, adiciona ele como participante
    if (session?.user?.id) {
      await prisma.roomParticipant.upsert({
        where: {
          roomId_userId: {
            roomId,
            userId: session.user.id
          }
        },
        update: {},
        create: {
          roomId,
          userId: session.user.id
        }
      })
    }

    const currentStory = await prisma.story.findFirst({
      where: {
        roomId,
        revealed: false
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    if (!currentStory) {
      // Se não houver história, criar uma nova
      const newStory = await prisma.story.create({
        data: {
          roomId,
          title: 'Nova História',
          revealed: false
        }
      })
      return NextResponse.json(newStory)
    }

    return NextResponse.json(currentStory)
  } catch {
    return NextResponse.json(
      { error: 'Erro ao buscar história atual' },
      { status: 500 }
    )
  }
} 