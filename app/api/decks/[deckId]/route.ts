import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

async function ownedDeck(deckId: string, userId: string) {
  return prisma.customDeck.findFirst({ where: { id: deckId, userId } });
}

export async function PATCH(
  request: Request,
  props: { params: Promise<{ deckId: string }> }
) {
  const { deckId } = await props.params;
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const deck = await ownedDeck(deckId, session.user.id);
    if (!deck) {
      return NextResponse.json({ error: "Baralho não encontrado" }, { status: 404 });
    }

    const { name, values } = await request.json();

    const updated = await prisma.customDeck.update({
      where: { id: deckId },
      data: {
        ...(typeof name === "string" && name.trim() ? { name: name.trim() } : {}),
        ...(Array.isArray(values) && values.length > 0
          ? { values: values.map(String) }
          : {}),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[decks] erro ao atualizar baralho", error);
    return NextResponse.json(
      { error: "Erro ao atualizar baralho" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  props: { params: Promise<{ deckId: string }> }
) {
  const { deckId } = await props.params;
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    await prisma.customDeck.deleteMany({
      where: { id: deckId, userId: session.user.id },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[decks] erro ao excluir baralho", error);
    return NextResponse.json({ error: "Erro ao excluir baralho" }, { status: 500 });
  }
}
