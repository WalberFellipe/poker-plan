import { getPusherServerInstance } from "./pusher";
import { RoomEvent } from "./realtime";

const pusher = getPusherServerInstance();
export async function pushToRoom(roomId: string, event: RoomEvent) {
  await pusher.trigger(`room-${roomId}`, event.type, event.data);
}
