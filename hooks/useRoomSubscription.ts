"use client"

import { useEffect } from 'react'
import { pusherClient } from '@/lib/pusher'
import { RoomEvent } from '@/lib/realtime'

export function useRoomSubscription(roomId: string, onEvent: (event: RoomEvent) => void) {
  useEffect(() => {
    // Inscreve no canal da sala
    const channel = pusherClient.subscribe(`room-${roomId}`)

    // Configura os listeners para diferentes tipos de eventos
    channel.bind('vote', (data: RoomEvent['data']) => {
      onEvent({ type: 'vote', data })
    })

    channel.bind('reveal', (data: RoomEvent['data']) => {
      onEvent({ type: 'reveal', data })
    })

    channel.bind('reset', (data: RoomEvent['data']) => {
      onEvent({ type: 'reset', data })
    })

    // Cleanup na desmontagem
    return () => {
      channel.unbind_all()
      pusherClient.unsubscribe(`room-${roomId}`)
    }
  }, [roomId, onEvent])
} 