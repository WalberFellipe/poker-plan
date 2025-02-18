import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(
  request: Request,
  { params }: { params: { roomId: string } }
) {
  const roomId = await Promise.resolve(params.roomId)
  const session = await getServerSession(authOptions)
  
  try {
    const { name } = await request.json()
    console.log('Tentando entrar na sala:', { roomId, name, userId: session?.user?.id })

    // Primeiro, verificar se a sala existe
    const room = await prisma.room.findUnique({
      where: { id: roomId }
    })

    if (!room) {
      console.error('Sala não encontrada:', roomId)
      return new NextResponse('Sala não encontrada', { status: 404 })
    }

    if (session?.user?.id) {
      console.log('Criando participante autenticado')
      // Se estiver logado, adiciona como participante normal
      const participant = await prisma.roomParticipant.upsert({
        where: {
          roomId_userId: {
            roomId,
            userId: session.user.id
          }
        },
        update: {},
        create: {
          roomId,
          userId: session.user.id
        }
      })
      return NextResponse.json({ participantId: participant.id })
    } else {
      console.log('Criando participante anônimo')
      // Se não estiver logado, cria participante anônimo
      const anonymousParticipant = await prisma.anonymousParticipant.create({
        data: {
          name,
          roomId
        }
      })
      return NextResponse.json({ participantId: anonymousParticipant.id })
    }
  } catch (error) {
    console.error('Erro detalhado ao entrar na sala:', error)
    return new NextResponse(
      `Erro ao entrar na sala: ${error instanceof Error ? error.message : 'Erro desconhecido'}`, 
      { status: 500 }
    )
  }
} 