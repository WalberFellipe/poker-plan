"use client"

import { useEffect, useRef } from 'react'
import { pusherClient } from '@/lib/pusher'
import {
  RealtimeParticipantJoinEvent,
  RealtimeParticipantLeaveEvent,
  RealtimeCardSelectedEvent,
  RealtimeRevealEvent,
} from '@/types/realtime-events'

interface RealtimeEvents {
  "vote:new": {
    storyId: string;
    userId: string;
    value: number;
    participantId: string;
  };
  "vote:reveal": RealtimeRevealEvent;
  "vote:reset": {
    storyId: string;
  };
  "story:reset": {
    oldStoryId: string;
    newStoryId: string;
  };
  "participant:join": RealtimeParticipantJoinEvent;
  "participant:leave": RealtimeParticipantLeaveEvent;
  "card:selected": RealtimeCardSelectedEvent;
}

type EventHandlers = {
  [K in keyof RealtimeEvents]: (data: RealtimeEvents[K]) => void
}

declare module './useRealtime' {
  interface EventHandlers {
    'participant:join': (data: RealtimeParticipantJoinEvent) => void;
    'participant:leave': (data: RealtimeParticipantLeaveEvent) => void;
  }
}

const REALTIME_EVENT_NAMES: (keyof RealtimeEvents)[] = [
  "vote:new",
  "vote:reveal",
  "vote:reset",
  "story:reset",
  "participant:join",
  "participant:leave",
  "card:selected",
]

export function useRealtime(roomId: string, handlers: Partial<EventHandlers>) {
  // Guardamos os handlers em uma ref para que a subscription Pusher seja
  // estável — dependia antes de `handlers` no array de deps, o que fazia
  // o efeito fazer unsubscribe/subscribe a cada render do componente pai.
  // Entre um e outro eventos podiam ser perdidos (ex: vote:reveal), o que
  // batia especialmente com 3+ participantes na sala.
  const handlersRef = useRef(handlers)

  useEffect(() => {
    handlersRef.current = handlers
  })

  useEffect(() => {
    const channel = pusherClient.subscribe(`room-${roomId}`)

    const wrappers: Array<{ event: string; fn: (data: unknown) => void }> = []

    for (const event of REALTIME_EVENT_NAMES) {
      const wrapper = (data: unknown) => {
        const handler = handlersRef.current[event] as
          | ((data: unknown) => void)
          | undefined
        if (handler) handler(data)
      }
      wrappers.push({ event, fn: wrapper })
      channel.bind(event, wrapper)
    }

    return () => {
      for (const { event, fn } of wrappers) {
        channel.unbind(event, fn)
      }
      pusherClient.unsubscribe(`room-${roomId}`)
    }
  }, [roomId])
}
