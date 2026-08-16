import { prisma } from "@/lib/prisma";

/**
 * Remove salas expiradas.
 *
 * Participantes, histórias, votos, fichas, tarefas e estimativas têm
 * `onDelete: Cascade` para Room, então apagar a sala já leva tudo junto — não é
 * mais preciso encadear deleteMany por tabela como na versão anterior.
 */
export async function cleanupExpiredRooms() {
  try {
    const { count } = await prisma.room.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });

    return { deletedRooms: count };
  } catch (error) {
    console.error("Failed to cleanup expired rooms:", error);
    throw error;
  }
}
