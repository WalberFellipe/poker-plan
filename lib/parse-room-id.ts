
export function parseRoomIdFromInput(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  try {
    const u = new URL(trimmed);
    const match = u.pathname.match(/\/room\/([^/?#]+)/);
    if (match?.[1]) return decodeURIComponent(match[1]);
  } catch {
  }

  const pathLike = trimmed.replace(/^https?:\/\/[^/]+/i, "");
  const pathMatch = pathLike.match(/\/room\/([^/?#]+)/);
  if (pathMatch?.[1]) return decodeURIComponent(pathMatch[1]);

  return trimmed;
}
