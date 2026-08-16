-- AlterTable
ALTER TABLE "Estimate" ADD COLUMN     "taskId" TEXT;

-- AddForeignKey
ALTER TABLE "Estimate" ADD CONSTRAINT "Estimate_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE SET NULL ON UPDATE CASCADE;

