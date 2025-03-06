import { prisma } from '@/lib/prisma'

export async function cleanupExpiredRooms() {
  try {
    const expiredRooms = await prisma.room.findMany({
      where: {
        expiresAt: {
          lt: new Date()
        }
      },
      select: {
        id: true
      }
    })

    const expiredRoomIds = expiredRooms.map(room => room.id)

    // Deletar em transação para garantir consistência
    const result = await prisma.$transaction([
      // Limpar votos anônimos
      prisma.anonymousVote.deleteMany({
        where: {
          story: {
            roomId: {
              in: expiredRoomIds
            }
          }
        }
      }),
      // Limpar participantes anônimos
      prisma.anonymousParticipant.deleteMany({
        where: {
          roomId: {
            in: expiredRoomIds
          }
        }
      }),
      // Limpar participantes
      prisma.roomParticipant.deleteMany({
        where: {
          roomId: {
            in: expiredRoomIds
          }
        }
      }),
      // Deletar as salas
      prisma.room.deleteMany({
        where: {
          id: {
            in: expiredRoomIds
          }
        }
      })
    ])

    return {
      deletedRooms: result[3].count,
      deletedParticipants: result[2].count,
      deletedAnonymousParticipants: result[1].count,
      deletedAnonymousVotes: result[0].count
    }
  } catch (error) {
    console.error('Failed to cleanup expired rooms:', error)
    throw error
  }
}
