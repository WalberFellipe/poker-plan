import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"
import { getPusher } from "@/lib/pusher"

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const { name, participantName, deckValues } = await req.json();

    if (!name) {
      return NextResponse.json(
        { error: "Nome da sala é obrigatório" },
        { status: 400 }
      );
    }

    // Primeiro criar um usuário anônimo se não houver sessão
    let ownerId = session?.user?.id;
    let participant;

    if (!ownerId) {
      const anonymousUser = await prisma.user.create({
        data: {
          name: participantName || "Anônimo",
        },
      });
      ownerId = anonymousUser.id;
    }

    // Criar sala com o ownerId válido
    const room = await prisma.room.create({
      data: {
        name,
        ownerId,
        expiresAt: new Date(Date.now() + 4 * 60 * 60 * 1000),
        deckValues,
      },
    });

    // Criar o participante apropriado
    if (session?.user?.id) {
      participant = await prisma.roomParticipant.create({
        data: {
          roomId: room.id,
          userId: session.user.id,
        },
      });
    } else {
      participant = await prisma.anonymousParticipant.create({
        data: {
          roomId: room.id,
          name: participantName,
        },
      });
    }

    // Notificar outros participantes via Pusher
    await getPusher().trigger(room.id, "participant:join", {
      participantId: participant.id,
      name: session?.user?.name || participantName,
      image: session?.user?.image || null,
      isAnonymous: !session?.user,
    });

    return NextResponse.json({
      success: true,
      room,
      participant,
      participantId: participant.id,
    });
  } catch {
    return NextResponse.json({ 
      success: false,
      error: "Erro ao criar sala" 
    }, { 
      status: 500 
    })
  }
} 