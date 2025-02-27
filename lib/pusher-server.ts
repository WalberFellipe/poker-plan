import { pusher } from './pusher'
import { RoomEvent } from './realtime'

export async function pushToRoom(roomId: string, event: RoomEvent) {
  await pusher.trigger(`room-${roomId}`, event.type, event.data);
} 