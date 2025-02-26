"use client"

import { useEffect } from 'react'
import { pusherClient } from '@/lib/pusher'
import { RealtimeParticipantJoinEvent, RealtimeParticipantLeaveEvent } from '@/types/realtime-events'

interface RealtimeEvents {
  "vote:new": {
    storyId: string;
    userId: string;
    value: number;
  };
  "vote:reveal": {
    storyId: string;
    votes: Array<{
      id: string;
      storyId: string;
      participantId: string;
      value: number;
      createdAt: string;
    }>;
  };
  "vote:reset": {
    storyId: string;
  };
  "story:reset": {
    oldStoryId: string;
    newStoryId: string;
  };
  "participant:join": RealtimeParticipantJoinEvent;
  "participant:leave": RealtimeParticipantLeaveEvent;
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

export function useRealtime(roomId: string, handlers: Partial<EventHandlers>) {
  useEffect(() => {
    const channel = pusherClient.subscribe(`room-${roomId}`)

    Object.entries(handlers).forEach(([event, handler]) => {
      channel.bind(event, handler)
    })

    return () => {
      channel.unbind_all()
      pusherClient.unsubscribe(`room-${roomId}`)
    }
  }, [roomId, handlers])
} 