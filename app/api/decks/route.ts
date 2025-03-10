import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"

export async function GET() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Não autorizado" },
      { status: 401 }
    )
  }

  try {
    const decks = await prisma.customDeck.findMany({
      where: {
        userId: session.user.id
      }
    })

    return NextResponse.json(decks)
  } catch {
    return NextResponse.json(
      { error: "Erro ao carregar baralhos" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Não autorizado" },
      { status: 401 }
    )
  }

  try {
    const { name, values } = await request.json()

    const deck = await prisma.customDeck.create({
      data: {
        name,
        values,
        userId: session.user.id
      }
    })

    return NextResponse.json(deck)
  } catch {
    return NextResponse.json(
      { error: "Erro ao criar baralho" },
      { status: 500 }
    )
  }
} 