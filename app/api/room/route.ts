import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { readClientId } from "@/lib/participant";
import { ensureCurrentStory } from "@/lib/room-state";

const ROOM_TTL_MS = 4 * 60 * 60 * 1000;

const DEFAULT_DECK = ["0", "½", "1", "2", "3", "5", "8", "13", "20", "40", "?", "∞"];

/** Cria a sala e já senta quem criou à mesa. */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const clientId = readClientId(request);
    const { name, participantName, deckValues } = await request.json();

    if (typeof name !== "string" || name.trim() === "") {
      return NextResponse.json(
        { error: "Nome da sala é obrigatório" },
        { status: 400 }
      );
    }

    const ownerName = session?.user?.name ?? participantName ?? "Anônimo";

    // Sala sem login simplesmente não tem dono. A versão anterior criava um
    // `User` fantasma só para preencher a relação, e ele sobrevivia à sala.
    const ownerId = session?.user?.id ?? null;

    const values =
      Array.isArray(deckValues) && deckValues.length > 0
        ? deckValues.map(String)
        : DEFAULT_DECK;

    const room = await prisma.room.create({
      data: {
        name: name.trim(),
        ownerId,
        expiresAt: new Date(Date.now() + ROOM_TTL_MS),
        deckValues: values,
      },
    });

    if (clientId) {
      await prisma.participant.create({
        data: {
          roomId: room.id,
          userId: session?.user?.id ?? null,
          clientId,
          name: ownerName,
          image: session?.user?.image ?? null,
        },
      });
    }

    await ensureCurrentStory(room.id);

    return NextResponse.json({ success: true, room, roomId: room.id });
  } catch (error) {
    console.error("[room] erro ao criar sala", error);
    return NextResponse.json(
      { success: false, error: "Erro ao criar sala" },
      { status: 500 }
    );
  }
}
