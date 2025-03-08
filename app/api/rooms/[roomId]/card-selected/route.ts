import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { pusher } from "@/lib/pusher";

export async function POST(
  request: Request,
  { params }: { params: { roomId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const { participantId, storyId } = await request.json();

    await pusher.trigger(`room-${params.roomId}`, "card:selected", {
      participantId,
      userId: session?.user?.id,
      storyId
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Erro ao notificar seleção de carta" },
      { status: 500 }
    );
  }
} 