import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: Request,
  props: { params: Promise<{ roomId: string }> }
) {
  const { roomId } = await props.params;

  try {
    const room = await prisma.room.findUnique({
      where: { id: roomId },
    });

    if (!room) {
      return NextResponse.json(
        { error: "Sala não encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json(room);
  } catch {
    return NextResponse.json(
      { error: "Erro ao carregar sala" },
      { status: 500 }
    );
  }
} 