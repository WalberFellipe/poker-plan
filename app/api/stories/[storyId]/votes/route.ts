import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
// import { pusherServer } from '@/lib/pusher'

export async function GET(
  request: Request,
  { params }: { params: { storyId: string } }
) {
  const storyId = await Promise.resolve(params.storyId)

  try {
    // Buscar votos de usuários autenticados
    const authenticatedVotes = await prisma.vote.findMany({
      where: {
        storyId
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true
          }
        }
      }
    })

    // Buscar votos anônimos
    const anonymousVotes = await prisma.anonymousVote.findMany({
      where: {
        storyId: storyId
      },
      include: {
        participant: true
      }
    })

    // Combinar os votos
    const allVotes = [
      ...authenticatedVotes.map(v => ({
        id: v.id,
        userId: v.userId,
        value: v.value,
        user: v.user,
        isAnonymous: false
      })),
      ...anonymousVotes.map(v => ({
        id: v.id,
        userId: v.participantId,
        value: v.value,
        user: {
          id: v.participantId,
          name: v.participant.name,
          image: null
        },
        isAnonymous: true
      }))
    ]

    return NextResponse.json(allVotes)
  } catch (error) {
    console.error('Erro ao buscar votos:', error)
    return new NextResponse('Erro ao buscar votos', { status: 500 })
  }
}

export async function POST(
  request: Request,
  { params }: { params: { storyId: string } }
) {
  const session = await getServerSession(authOptions)
  const { value, participantId } = await request.json()
  const storyId = params.storyId

  try {
    if (session?.user?.id) {
      // Voto de usuário autenticado
      const vote = await prisma.vote.upsert({
        where: {
          storyId_userId: {
            storyId,
            userId: session.user.id
          }
        },
        update: { value },
        create: {
          storyId,
          userId: session.user.id,
          value
        }
      })
      return NextResponse.json(vote)
    } else if (participantId) {
      // Verificar se o participante anônimo existe
      const participant = await prisma.anonymousParticipant.findUnique({
        where: { id: participantId }
      })

      if (!participant) {
        return new NextResponse('Participante não encontrado', { status: 404 })
      }

      // Voto de usuário anônimo
      const vote = await prisma.anonymousVote.upsert({
        where: {
          storyId_participantId: {
            storyId,
            participantId
          }
        },
        update: { value },
        create: {
          storyId,
          participantId,
          value
        }
      })
      return NextResponse.json(vote)
    }

    return new NextResponse('Usuário não autorizado', { status: 401 })
  } catch (error) {
    console.error('Erro ao salvar voto:', error)
    return new NextResponse(`Erro ao salvar voto: ${error}`, { status: 500 })
  }
} 