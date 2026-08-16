import { prisma } from "@/lib/prisma";
import { getPusher } from "@/lib/pusher";
import {
  ROOM_STATE_EVENT,
  RoomSnapshot,
  SnapshotChip,
  SnapshotEstimate,
  SnapshotParticipant,
  SnapshotStory,
  SnapshotTask,
  ChipKind,
  ChipMode,
  TaskSource,
  TaskStatus,
} from "@/types/room-state";

/**
 * Pusher recusa payloads acima de 10KB. Salas grandes (muitos participantes,
 * fichas e fila) podem passar disso, então acima deste limite publicamos só o
 * número da versão e o cliente busca o snapshot por GET. O resultado é o mesmo,
 * só custa um round-trip.
 */
const MAX_PUSHER_PAYLOAD_BYTES = 9 * 1024;

export function channelForRoom(roomId: string) {
  return `room-${roomId}`;
}

/**
 * Monta o estado completo da sala.
 *
 * Regra de privacidade: `vote` só é preenchido quando a história está revelada.
 * Antes disso o snapshot carrega apenas `hasVoted`, então nem o devtools de um
 * participante curioso consegue antecipar o número dos outros.
 */
export async function buildRoomSnapshot(
  roomId: string
): Promise<RoomSnapshot | null> {
  const room = await prisma.room.findUnique({
    where: { id: roomId },
    include: {
      participants: {
        orderBy: { createdAt: "asc" },
        include: {
          callsReceived: { select: { id: true, storyId: true } },
        },
      },
      tasks: { orderBy: { order: "asc" } },
      estimates: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!room) return null;

  const story = await prisma.story.findFirst({
    where: { roomId },
    orderBy: { createdAt: "desc" },
    include: {
      votes: true,
      chips: { orderBy: { createdAt: "asc" } },
    },
  });

  const votesByParticipant = new Map(
    (story?.votes ?? []).map((v) => [v.participantId, v.value])
  );

  const callsThisStory = new Map<string, number>();
  for (const participant of room.participants) {
    const count = participant.callsReceived.filter(
      (chip) => chip.storyId === story?.id
    ).length;
    callsThisStory.set(participant.id, count);
  }

  const participants: SnapshotParticipant[] = room.participants.map((p) => ({
    id: p.id,
    name: p.name,
    image: p.image,
    role: p.role,
    isAnonymous: p.userId === null,
    isOnline: p.isOnline,
    hasVoted: votesByParticipant.has(p.id),
    vote: story?.revealed ? votesByParticipant.get(p.id) ?? null : null,
    callsReceived: callsThisStory.get(p.id) ?? 0,
  }));

  const snapshotStory: SnapshotStory | null = story
    ? {
        id: story.id,
        title: story.title,
        taskId: story.taskId,
        revealed: story.revealed,
        revealAt: story.revealAt?.toISOString() ?? null,
        startedAt: story.startedAt.toISOString(),
      }
    : null;

  const chips: SnapshotChip[] = (story?.chips ?? []).map((c) => ({
    id: c.id,
    authorId: c.authorId,
    targetId: c.targetId,
    kind: c.kind as ChipKind,
    mode: c.mode as ChipMode,
    jitterX: c.jitterX,
    jitterY: c.jitterY,
    rot: c.rot,
    createdAt: c.createdAt.toISOString(),
  }));

  const queue: SnapshotTask[] = room.tasks
    .filter((t) => t.status !== "estimated")
    .map((t) => ({
      id: t.id,
      key: t.key,
      title: t.title,
      source: t.source as TaskSource,
      type: t.type,
      externalUrl: t.externalUrl,
      order: t.order,
      status: t.status as TaskStatus,
    }));

  const estimates: SnapshotEstimate[] = room.estimates.map((e) => ({
    id: e.id,
    key: e.key,
    title: e.title,
    source: e.source as TaskSource,
    points: e.points,
    consensus: e.consensus,
    durationSeconds: e.durationSeconds,
    createdAt: e.createdAt.toISOString(),
  }));

  return {
    version: room.version,
    serverNow: new Date().toISOString(),
    room: {
      id: room.id,
      name: room.name,
      deckValues: room.deckValues,
      expiresAt: room.expiresAt.toISOString(),
      ownerId: room.ownerId,
    },
    story: snapshotStory,
    participants,
    chips,
    queue,
    estimates,
  };
}

/**
 * Devolve a história em jogo, criando uma se a sala ainda não tiver nenhuma.
 * O título sai da tarefa ativa da fila, quando existir.
 */
export async function ensureCurrentStory(roomId: string) {
  const existing = await prisma.story.findFirst({
    where: { roomId },
    orderBy: { createdAt: "desc" },
  });

  if (existing) return existing;

  const activeTask = await prisma.task.findFirst({
    where: { roomId, status: { not: "estimated" } },
    orderBy: { order: "asc" },
  });

  if (activeTask && activeTask.status !== "active") {
    await prisma.task.update({
      where: { id: activeTask.id },
      data: { status: "active" },
    });
  }

  return prisma.story.create({
    data: {
      roomId,
      title: activeTask?.title ?? "Nova rodada",
      taskId: activeTask?.id ?? null,
    },
  });
}

/**
 * Incrementa a versão da sala e publica o snapshot resultante.
 *
 * Chame isto no fim de *toda* rota que muda o estado da sala. O incremento é
 * atômico no banco, então dois participantes votando ao mesmo tempo produzem
 * duas versões distintas e os clientes convergem para a maior.
 */
export async function publishRoomState(
  roomId: string
): Promise<RoomSnapshot | null> {
  await prisma.room.update({
    where: { id: roomId },
    data: { version: { increment: 1 } },
  });

  const snapshot = await buildRoomSnapshot(roomId);
  if (!snapshot) return null;

  const payload = JSON.stringify(snapshot);

  try {
    if (Buffer.byteLength(payload, "utf8") > MAX_PUSHER_PAYLOAD_BYTES) {
      // Grande demais para o canal: manda só a versão. O cliente vê que está
      // atrás e busca o snapshot completo por GET.
      await getPusher().trigger(channelForRoom(roomId), ROOM_STATE_EVENT, {
        version: snapshot.version,
        serverNow: snapshot.serverNow,
        truncated: true,
      });
    } else {
      await getPusher().trigger(
        channelForRoom(roomId),
        ROOM_STATE_EVENT,
        snapshot
      );
    }
  } catch (error) {
    // Uma falha de publicação não pode derrubar a mutação: o banco já foi
    // atualizado, e o poll de reconciliação do cliente recupera o estado.
    console.error("[room-state] falha ao publicar no Pusher", error);
  }

  return snapshot;
}

// A matemática dos votos vive em `lib/vote-stats` para que cliente e servidor
// usem exatamente a mesma conta.
export {
  toNumericVote,
  computeConsensus,
  computeMedian,
  computeAverage,
} from "@/lib/vote-stats";
