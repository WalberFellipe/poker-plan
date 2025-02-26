"use client"

import { useEffect } from 'react'
import { pusherClient } from '@/lib/pusher'
import { RoomEvent } from '@/lib/realtime'

export function useRoomSubscription(roomId: string, onEvent: (event: RoomEvent) => void) {
  useEffect(() => {
    const channel = pusherClient.subscribe(`room-${roomId}`)

    channel.bind('vote', (data: RoomEvent['data']) => {
      onEvent({ type: 'vote', data })
    })

    channel.bind('reveal', (data: RoomEvent['data']) => {
      onEvent({ type: 'reveal', data })
    })

    channel.bind('reset', (data: RoomEvent['data']) => {
      onEvent({ type: 'reset', data })
    })

    return () => {
      channel.unbind_all()
      pusherClient.unsubscribe(`room-${roomId}`)
    }
  }, [roomId, onEvent])
} 