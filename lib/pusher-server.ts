import { getPusher } from './pusher'
import { RoomEvent } from './realtime'

export async function pushToRoom(roomId: string, event: RoomEvent) {
  await getPusher().trigger(`room-${roomId}`, event.type, event.data);
} 