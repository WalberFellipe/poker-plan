import { pusherServer } from './pusher'
import { RoomEvent } from './realtime'

export async function pushToRoom(roomId: string, event: RoomEvent) {
  await pusherServer.trigger(
    `room-${roomId}`,
    event.type,
    event.data
  )
} 