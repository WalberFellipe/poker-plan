import EstimatesClient from "./estimates-client";

export default async function EstimatesPage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const { roomId } = await params;
  return <EstimatesClient roomId={roomId} />;
}
