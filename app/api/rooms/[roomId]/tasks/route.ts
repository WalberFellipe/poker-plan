import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveParticipant } from "@/lib/participant";
import { publishRoomState } from "@/lib/room-state";
import type { TaskSource } from "@/types/room-state";

const SOURCES: TaskSource[] = ["manual", "jira", "trello", "github", "izzyplan"];

interface IncomingTask {
  key?: unknown;
  title?: unknown;
  source?: unknown;
  type?: unknown;
  externalId?: unknown;
  externalUrl?: unknown;
}

/** Adiciona uma ou várias tarefas ao fim da fila de votação. */
export async function POST(
  request: Request,
  props: { params: Promise<{ roomId: string }> }
) {
  const { roomId } = await props.params;

  try {
    const participant = await resolveParticipant(request, roomId);

    if (!participant) {
      return NextResponse.json(
        { error: "Entre na sala antes de gerenciar a fila" },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const incoming: IncomingTask[] = Array.isArray(body?.tasks)
      ? body.tasks
      : [body];

    const parsed = incoming
      .map((task) => ({
        key: typeof task.key === "string" ? task.key.trim() : "",
        title: typeof task.title === "string" ? task.title.trim() : "",
        source: SOURCES.includes(task.source as TaskSource)
          ? (task.source as TaskSource)
          : "manual",
        type: typeof task.type === "string" ? task.type : null,
        externalId: typeof task.externalId === "string" ? task.externalId : null,
        externalUrl: typeof task.externalUrl === "string" ? task.externalUrl : null,
      }))
      .filter((task) => task.title !== "");

    if (parsed.length === 0) {
      return NextResponse.json({ error: "Nenhuma tarefa válida" }, { status: 400 });
    }

    const last = await prisma.task.findFirst({
      where: { roomId },
      orderBy: { order: "desc" },
      select: { order: true },
    });

    let nextOrder = (last?.order ?? -1) + 1;

    await prisma.task.createMany({
      data: parsed.map((task) => ({
        roomId,
        key: task.key || `T-${nextOrder + 1}`,
        title: task.title,
        source: task.source,
        type: task.type,
        externalId: task.externalId,
        externalUrl: task.externalUrl,
        order: nextOrder++,
      })),
    });

    const snapshot = await publishRoomState(roomId);

    return NextResponse.json({ success: true, added: parsed.length, snapshot });
  } catch (error) {
    console.error("[tasks] erro ao adicionar tarefas", error);
    return NextResponse.json({ error: "Erro ao adicionar tarefas" }, { status: 500 });
  }
}
