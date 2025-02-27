import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  props: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await props.params;

    // Buscar participantes autenticados
    const authenticatedParticipants = await prisma.roomParticipant.findMany({
      where: { roomId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    // Buscar participantes anônimos
    const anonymousParticipants = await prisma.anonymousParticipant.findMany({
      where: { roomId },
    });

    // Formatar participantes para o formato esperado pelo frontend
    const participants = [
      ...authenticatedParticipants.map((p) => ({
        id: p.id,
        userId: p.userId,
        name: p.user.name || "Anônimo",
        image: p.user.image,
        isAnonymous: false,
        hasVoted: false,
      })),
      ...anonymousParticipants.map((p) => ({
        id: p.id,
        userId: p.id,
        name: p.name || "Anônimo",
        image: null,
        isAnonymous: true,
        hasVoted: false,
      })),
    ];

    return NextResponse.json(participants);
  } catch {
    return NextResponse.json(
      { error: "Erro ao buscar participantes" },
      { status: 500 }
    );
  }
}
