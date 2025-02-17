import { prisma } from './prisma'

export type RoomEvent = {
  type: 'vote' | 'reveal' | 'reset' | 'join' | 'leave'
  roomId: string
  data: any
}

export class RealtimeService {
  private static instance: RealtimeService
  private subscriptions: Map<string, Set<(event: RoomEvent) => void>>

  private constructor() {
    this.subscriptions = new Map()
    this.initializePulse()
  }

  static getInstance() {
    if (!this.instance) {
      this.instance = new RealtimeService()
    }
    return this.instance
  }

  private async initializePulse() {
    try {
      // Inscrever para mudanças em Room
      const roomSubscription = await prisma.room.subscribe({
        create: true,
        update: true,
        delete: true,
      })

      // Inscrever para mudanças em Vote
      const voteSubscription = await prisma.vote.subscribe({
        create: true,
        update: true,
        delete: true,
      })

      // Processar eventos de sala
      for await (const event of roomSubscription) {
        const roomId = event.data.id as string
        if (this.subscriptions.has(roomId)) {
          const handlers = this.subscriptions.get(roomId)!
          handlers.forEach(handler => {
            handler({
              type: event.action === 'create' ? 'join' : 'leave',
              roomId,
              data: event.data
            })
          })
        }
      }

      // Processar eventos de votos
      for await (const event of voteSubscription) {
        const roomId = event.data.roomId as string
        if (this.subscriptions.has(roomId)) {
          const handlers = this.subscriptions.get(roomId)!
          handlers.forEach(handler => {
            handler({
              type: 'vote',
              roomId,
              data: event.data
            })
          })
        }
      }
    } catch (error) {
      console.error('Erro ao inicializar Pulse:', error)
    }
  }

  subscribe(roomId: string, handler: (event: RoomEvent) => void) {
    if (!this.subscriptions.has(roomId)) {
      this.subscriptions.set(roomId, new Set())
    }
    this.subscriptions.get(roomId)!.add(handler)

    return () => {
      const handlers = this.subscriptions.get(roomId)
      if (handlers) {
        handlers.delete(handler)
        if (handlers.size === 0) {
          this.subscriptions.delete(roomId)
        }
      }
    }
  }
} 