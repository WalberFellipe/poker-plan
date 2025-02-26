import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { pusher } from "@/lib/pusher";

export async function GET(
  request: Request,
  { params }: { params: { storyId: string } }
) {
  try {
    const { storyId } = await Promise.resolve(params)

    // Buscar a história com todos os votos
    const story = await prisma.story.findUnique({
      where: { id: storyId },
      include: {
        votes: true,
        anonymousVotes: {
          include: {
            participant: true
          }
        }
      }
    })

    if (!story?.revealed) {
      return NextResponse.json([])
    }

    // Combinar votos normais e anônimos
    const allVotes = [
      ...story.votes,
      ...story.anonymousVotes.map(vote => ({
        id: vote.id,
        value: vote.value,
        storyId: vote.storyId,
        userId: vote.participantId,
        userName: vote.participant.name
      }))
    ]

    return NextResponse.json(allVotes)
  } catch {
    return NextResponse.json(
      { error: 'Erro ao buscar votos' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: Request,
  { params }: { params: { storyId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    const { value, participantId } = await request.json()
    const { storyId } = await Promise.resolve(params)

    // Verificar se a história existe
    const story = await prisma.story.findUnique({
      where: { id: storyId },
      include: { room: true }
    })

    if (!story) {
      return NextResponse.json(
        { error: "História não encontrada" },
        { status: 404 }
      )
    }

    let vote;

    if (session?.user?.id) {
      // Usuário autenticado
      const existingVote = await prisma.vote.findFirst({
        where: {
          userId: session.user.id,
          storyId
        }
      })

      if (existingVote) {
        vote = await prisma.vote.update({
          where: { id: existingVote.id },
          data: { value }
        })
      } else {
        vote = await prisma.vote.create({
          data: {
            storyId,
            userId: session.user.id,
            value
          }
        })
      }

      // Notificar via Pusher
      await pusher.trigger(`room-${story.roomId}`, "vote:new", {
        storyId,
        userId: session.user.id,
        value: story.revealed ? value : undefined,
        revealed: story.revealed,
      });

    } else if (participantId) {
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

      // Participante anônimo
      const existingVote = await prisma.anonymousVote.findFirst({
        where: {
          participantId,
          storyId
        }
      })

      if (existingVote) {
        vote = await prisma.anonymousVote.update({
          where: { id: existingVote.id },
          data: { value }
        })
      } else {
        vote = await prisma.anonymousVote.create({
          data: {
            storyId,
            participantId,
            value
          }
        })
      }

      // Notificar via Pusher
      await pusher.trigger(`room-${story.roomId}`, "vote:new", {
        storyId,
        userId: participantId,
        value: story.revealed ? value : undefined,
        revealed: story.revealed,
      });

    } else {
      return NextResponse.json(
        { error: "Usuário não autorizado" },
        { status: 401 }
      )
    }

    return NextResponse.json({ success: true, vote })
  } catch {
    return NextResponse.json(
      { error: 'Erro ao salvar voto' },
      { status: 500 }
    )
  }
} 