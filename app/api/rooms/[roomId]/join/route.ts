import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureParticipant } from "@/lib/participant";
import {
  buildRoomSnapshot,
  ensureCurrentStory,
  publishRoomState,
} from "@/lib/room-state";

/**
 * Entrar na sala. Idempotente por (roomId, clientId): chamar de novo depois de
 * um reload devolve a mesma cadeira em vez de criar uma duplicata.
 */
export async function POST(
  request: Request,
  props: { params: Promise<{ roomId: string }> }
) {
  const { roomId } = await props.params;

  try {
    const body = await request.json().catch(() => ({}));
    const name: string | undefined = body?.name;

    const room = await prisma.room.findUnique({ where: { id: roomId } });

    if (!room) {
      return NextResponse.json({ error: "Sala não encontrada" }, { status: 404 });
    }

    if (room.expiresAt < new Date()) {
      return NextResponse.json({ error: "Sala expirada" }, { status: 410 });
    }

    const participant = await ensureParticipant(request, roomId, name);

    if (!participant) {
      return NextResponse.json(
        { error: "Identificação do participante ausente" },
        { status: 400 }
      );
    }

    await ensureCurrentStory(roomId);
    const snapshot = (await publishRoomState(roomId)) ?? (await buildRoomSnapshot(roomId));

    return NextResponse.json({ participantId: participant.id, snapshot });
  } catch (error) {
    console.error("[join] erro ao entrar na sala", error);
    return NextResponse.json({ error: "Erro ao entrar na sala" }, { status: 500 });
  }
}
