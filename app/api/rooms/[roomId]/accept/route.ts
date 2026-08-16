import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveParticipant } from "@/lib/participant";
import {
  computeConsensus,
  computeMedian,
  publishRoomState,
} from "@/lib/room-state";

/**
 * Aceitar a estimativa da rodada.
 *
 * Registra a tarefa em Estimativas com os pontos e o consenso calculados,
 * tira-a da fila, promove a próxima e abre uma rodada limpa.
 */
export async function POST(
  request: Request,
  props: { params: Promise<{ roomId: string }> }
) {
  const { roomId } = await props.params;

  try {
    const participant = await resolveParticipant(request, roomId);

    if (!participant) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const story = await prisma.story.findFirst({
      where: { roomId },
      orderBy: { createdAt: "desc" },
      include: { votes: true, task: true },
    });

    if (!story) {
      return NextResponse.json({ error: "Nenhuma rodada em jogo" }, { status: 404 });
    }

    if (!story.revealed) {
      return NextResponse.json(
        { error: "Revele os votos antes de aceitar" },
        { status: 409 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const values = story.votes.map((v) => v.value);
    const median = computeMedian(values);

    // O cliente pode propor um valor (o time às vezes fecha em outro número);
    // na ausência dele usamos a mediana.
    const points =
      typeof body?.points === "string" && body.points.trim() !== ""
        ? body.points.trim()
        : median !== null
          ? String(median)
          : "?";

    const consensus = computeConsensus(values);

    // Quanto a rodada levou, do início da história até o aceite.
    const durationSeconds = Math.max(
      0,
      Math.round((Date.now() - story.startedAt.getTime()) / 1000)
    );

    await prisma.estimate.create({
      data: {
        roomId,
        taskId: story.taskId,
        key: story.task?.key ?? "—",
        title: story.title,
        source: story.task?.source ?? "manual",
        points,
        consensus,
        durationSeconds,
      },
    });

    if (story.taskId) {
      await prisma.task.update({
        where: { id: story.taskId },
        data: { status: "estimated" },
      });
    }

    await prisma.story.update({
      where: { id: story.id },
      data: { finalScore: Number.isFinite(Number(points)) ? Number(points) : null },
    });

    const nextTask = await prisma.task.findFirst({
      where: { roomId, status: { not: "estimated" } },
      orderBy: { order: "asc" },
    });

    if (nextTask) {
      await prisma.task.update({
        where: { id: nextTask.id },
        data: { status: "active" },
      });
    }

    await prisma.story.create({
      data: {
        roomId,
        title: nextTask?.title ?? "Nova rodada",
        taskId: nextTask?.id ?? null,
      },
    });

    const snapshot = await publishRoomState(roomId);

    return NextResponse.json({ success: true, points, consensus, snapshot });
  } catch (error) {
    console.error("[accept] erro ao aceitar estimativa", error);
    return NextResponse.json(
      { error: "Erro ao aceitar estimativa" },
      { status: 500 }
    );
  }
}
