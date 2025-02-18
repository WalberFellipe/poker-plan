"use client"

import { Vote, User } from '@prisma/client'

type VoteWithUser = Vote & {
  user: Pick<User, 'id' | 'name' | 'image'>
}

export type RoomEvent = {
  type: 'vote' | 'reveal' | 'reset'
  data: {
    vote?: VoteWithUser
    revealed?: boolean
    reset?: boolean
  }
}

class RealtimeClient {
  private static instance: RealtimeClient
  private eventSources: Map<string, EventSource> = new Map()
  private subscribers: Map<string, Set<(event: RoomEvent) => void>> = new Map()

  private constructor() {}

  static getInstance(): RealtimeClient {
    if (!RealtimeClient.instance) {
      RealtimeClient.instance = new RealtimeClient()
    }
    return RealtimeClient.instance
  }

  subscribe(roomId: string, callback: (event: RoomEvent) => void): () => void {
    if (!this.subscribers.has(roomId)) {
      this.subscribers.set(roomId, new Set())
    }

    const roomSubscribers = this.subscribers.get(roomId)!
    roomSubscribers.add(callback)

    return () => {
      roomSubscribers.delete(callback)
      if (roomSubscribers.size === 0) {
        this.disconnect(roomId)
      }
    }
  }

  private disconnect(roomId: string) {
    const eventSource = this.eventSources.get(roomId)
    if (eventSource) {
      eventSource.close()
      this.eventSources.delete(roomId)
      this.subscribers.delete(roomId)
    }
  }
}

export const RealtimeService = RealtimeClient 