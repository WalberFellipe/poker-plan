import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveParticipant } from "@/lib/participant";
import { publishRoomState } from "@/lib/room-state";

/**
 * Nova rodada sobre a mesma tarefa: zera votos, fichas e cronômetro.
 *
 * Cria uma história nova em vez de limpar a atual, para que o histórico de
 * rodadas anteriores continue no banco.
 */
export async function POST(
  request: Request,
  props: { params: Promise<{ storyId: string }> }
) {
  const { storyId } = await props.params;

  try {
    const story = await prisma.story.findUnique({
      where: { id: storyId },
      select: { id: true, roomId: true, title: true, taskId: true },
    });

    if (!story) {
      return NextResponse.json({ error: "História não encontrada" }, { status: 404 });
    }

    const participant = await resolveParticipant(request, story.roomId);

    if (!participant) {
      return NextResponse.json(
        { error: "Entre na sala antes de resetar" },
        { status: 401 }
      );
    }

    const newStory = await prisma.story.create({
      data: {
        roomId: story.roomId,
        title: story.title,
        taskId: story.taskId,
      },
    });

    const snapshot = await publishRoomState(story.roomId);

    return NextResponse.json({ success: true, storyId: newStory.id, snapshot });
  } catch (error) {
    console.error("[reset] erro ao resetar rodada", error);
    return NextResponse.json({ error: "Erro ao resetar rodada" }, { status: 500 });
  }
}
