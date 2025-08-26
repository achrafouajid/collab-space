-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "isLocalOnly" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastSyncedAt" TIMESTAMP(3),
ADD COLUMN     "syncVersion" INTEGER NOT NULL DEFAULT 1;

-- CreateTable
CREATE TABLE "sync_logs" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "data" JSONB,
    "userId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "version" INTEGER NOT NULL DEFAULT 1,
    "checksum" TEXT,

    CONSTRAINT "sync_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "sync_logs_entityType_entityId_idx" ON "sync_logs"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "sync_logs_userId_timestamp_idx" ON "sync_logs"("userId", "timestamp");

-- CreateIndex
CREATE INDEX "sync_logs_timestamp_idx" ON "sync_logs"("timestamp");

-- CreateIndex
CREATE INDEX "sync_logs_entityType_timestamp_idx" ON "sync_logs"("entityType", "timestamp");

-- AddForeignKey
ALTER TABLE "sync_logs" ADD CONSTRAINT "sync_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
