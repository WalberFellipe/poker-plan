import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveParticipant } from "@/lib/participant";
import { publishRoomState } from "@/lib/room-state";

async function authorize(request: Request, roomId: string) {
  const participant = await resolveParticipant(request, roomId);
  return participant !== null;
}

/** Remove uma tarefa da fila. */
export async function DELETE(
  request: Request,
  props: { params: Promise<{ roomId: string; taskId: string }> }
) {
  const { roomId, taskId } = await props.params;

  try {
    if (!(await authorize(request, roomId))) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    await prisma.task.deleteMany({ where: { id: taskId, roomId } });
    await publishRoomState(roomId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[tasks] erro ao remover tarefa", error);
    return NextResponse.json({ error: "Erro ao remover tarefa" }, { status: 500 });
  }
}

/**
 * Coloca a tarefa na mesa: ela vira a ativa e uma rodada nova começa com o
 * título dela. Votos e fichas da rodada anterior ficam para trás.
 */
export async function PATCH(
  request: Request,
  props: { params: Promise<{ roomId: string; taskId: string }> }
) {
  const { roomId, taskId } = await props.params;

  try {
    if (!(await authorize(request, roomId))) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const task = await prisma.task.findFirst({ where: { id: taskId, roomId } });

    if (!task) {
      return NextResponse.json({ error: "Tarefa não encontrada" }, { status: 404 });
    }

    await prisma.$transaction([
      prisma.task.updateMany({
        where: { roomId, status: "active" },
        data: { status: "queued" },
      }),
      prisma.task.update({
        where: { id: task.id },
        data: { status: "active" },
      }),
      prisma.story.create({
        data: { roomId, title: task.title, taskId: task.id },
      }),
    ]);

    await publishRoomState(roomId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[tasks] erro ao promover tarefa", error);
    return NextResponse.json({ error: "Erro ao promover tarefa" }, { status: 500 });
  }
}
