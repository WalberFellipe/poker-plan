import TasksClient from "./tasks-client";

export default async function TasksPage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const { roomId } = await params;
  return <TasksClient roomId={roomId} />;
}
