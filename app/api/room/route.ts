import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { nanoid } from 'nanoid'
import { authOptions } from "@/lib/auth"

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  
  try {
    const { name } = await req.json()
    
    const room = await prisma.room.create({
      data: {
        name,
        code: nanoid(6),
        hostId: session?.user?.id || null,
      },
    })

    return NextResponse.json(room)
  } catch (error) {
    console.error("Erro ao criar sala:", error)
    return new NextResponse("Erro interno do servidor", { status: 500 })
  }
} 