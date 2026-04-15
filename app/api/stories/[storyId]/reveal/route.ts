import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getPusher } from '@/lib/pusher'

export async function POST(
  request: Request,
  props: { params: Promise<{ storyId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const body = await request.json()
    const { participantId } = body
    const { storyId } = await props.params
    const story = await prisma.story.findUnique({
      where: { id: storyId },
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
      data: { revealed: true },
    });

    const storyWithVotes = await prisma.story.findUnique({
      where: { id: storyId },
      include: {
        votes: {
          include: {
            user: { select: { id: true, name: true, image: true } },
          },
        },
        anonymousVotes: {
          include: { participant: true },
        },
      },
    });

    const votes = [
      ...(storyWithVotes?.votes ?? []).map((v) => ({
        id: v.id,
        storyId: v.storyId,
        userId: v.userId,
        participantId: v.userId,
        value: v.value,
        createdAt: v.createdAt.toISOString(),
        updatedAt: v.updatedAt.toISOString(),
        user: {
          id: v.user.id,
          name: v.user.name ?? "Anônimo",
          image: v.user.image ?? null,
        },
      })),
      ...(storyWithVotes?.anonymousVotes ?? []).map((v) => ({
        id: v.id,
        storyId: v.storyId,
        userId: v.participantId,
        participantId: v.participantId,
        value: v.value,
        createdAt: v.createdAt.toISOString(),
        updatedAt: v.updatedAt.toISOString(),
        user: {
          id: v.participantId,
          name: v.participant.name ?? "Anônimo",
          image: null,
        },
      })),
    ];

    await getPusher().trigger(`room-${story.roomId}`, "vote:reveal", {
      storyId,
      votes,
    });

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json(
      { error: "Erro ao revelar votos" },
      { status: 500 }
    )
  }
} 