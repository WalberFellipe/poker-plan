"use client"

import { useEffect } from 'react'
import { RealtimeService, RoomEvent } from '@/lib/realtime'

export function useRealtime(roomId: string, onEvent: (event: RoomEvent) => void) {
  useEffect(() => {
    const service = RealtimeService.getInstance()
    const unsubscribe = service.subscribe(roomId, onEvent)

    return () => {
      unsubscribe()
    }
  }, [roomId, onEvent])
} 