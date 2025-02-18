import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: { roomId: string } }
) {
  const roomId = await Promise.resolve(params.roomId);

  try {
    // Buscar participantes registrados
    const registeredParticipants = await prisma.roomParticipant.findMany({
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
      select: {
        id: true,
        name: true,
        createdAt: true,
      },
    });

    // Combinar os dois tipos de participantes
    const allParticipants = [
      ...registeredParticipants.map((p) => ({
        id: p.id,
        userId: p.user.id,
        name: p.user.name,
        image: p.user.image,
        isAnonymous: false,
      })),
      ...anonymousParticipants.map((p) => ({
        id: p.id,
        userId: p.id,
        name: p.name,
        image: null,
        isAnonymous: true,
      })),
    ];

    return NextResponse.json(allParticipants);
  } catch (error) {
    console.error("Erro ao buscar participantes:", error);
    return new NextResponse("Erro ao buscar participantes", { status: 500 });
  }
}
