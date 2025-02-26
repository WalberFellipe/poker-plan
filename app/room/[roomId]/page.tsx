import RoomClient from "./room-client";

interface RoomPageProps {
  params: { roomId: string }
}

export default async function RoomPage({ params }: RoomPageProps) {
  const { roomId } = await Promise.resolve(params)
  
  return <RoomClient roomId={roomId} />
}
