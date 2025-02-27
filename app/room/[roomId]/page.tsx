import RoomClient from "./room-client";

interface RoomPageProps {
  params: Promise<{ roomId: string }>
}

export default async function RoomPage({ params }: RoomPageProps) {
  const { roomId } = await params
  
  return <RoomClient roomId={roomId} />
}
