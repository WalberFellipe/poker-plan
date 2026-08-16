-- Room.ownerId passa a ser opcional, e os usuários fantasmas somem.
--
-- Criar uma sala sem login gerava uma linha em "User" só para satisfazer a
-- relação de dono. A sala expira e é apagada, mas esse usuário ficava: eram 72
-- registros órfãos acumulados na mesma tabela que guarda as contas reais.
--
-- A ordem importa. Primeiro soltamos o vínculo, depois apagamos os órfãos —
-- caso contrário a FK recusaria o delete.

-- DropForeignKey
ALTER TABLE "Room" DROP CONSTRAINT "Room_ownerId_fkey";

-- AlterTable
ALTER TABLE "Room" ALTER COLUMN "ownerId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Room" ADD CONSTRAINT "Room_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Solta as salas que ainda apontam para um usuário fantasma. O critério é
-- "sem e-mail e sem nenhuma conta OAuth": um usuário de verdade sempre tem ao
-- menos uma das duas coisas.
UPDATE "Room"
SET "ownerId" = NULL
WHERE "ownerId" IN (
  SELECT u."id" FROM "User" u
  WHERE u."email" IS NULL
    AND NOT EXISTS (SELECT 1 FROM "Account" a WHERE a."userId" = u."id")
);

-- Remove os fantasmas.
DELETE FROM "User" u
WHERE u."email" IS NULL
  AND NOT EXISTS (SELECT 1 FROM "Account" a WHERE a."userId" = u."id")
  AND NOT EXISTS (SELECT 1 FROM "Session" s WHERE s."userId" = u."id");
