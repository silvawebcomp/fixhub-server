CREATE TABLE "NotificationLog" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "repairId" INTEGER,
    "channel" TEXT NOT NULL,
    "recipient" TEXT NOT NULL,
    "subject" TEXT,
    "message" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Prepared',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NotificationLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "NotificationLog_userId_createdAt_idx"
ON "NotificationLog"("userId", "createdAt");

CREATE INDEX "NotificationLog_repairId_createdAt_idx"
ON "NotificationLog"("repairId", "createdAt");

ALTER TABLE "NotificationLog"
ADD CONSTRAINT "NotificationLog_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "NotificationLog"
ADD CONSTRAINT "NotificationLog_repairId_fkey"
FOREIGN KEY ("repairId") REFERENCES "Repair"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
