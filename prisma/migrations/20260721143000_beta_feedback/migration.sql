CREATE TABLE IF NOT EXISTS "BetaFeedback" (
    "id" SERIAL PRIMARY KEY,
    "userId" INTEGER NOT NULL,
    "authorId" INTEGER,
    "authorName" TEXT,
    "authorEmail" TEXT,
    "category" TEXT NOT NULL DEFAULT 'General',
    "rating" INTEGER,
    "message" TEXT NOT NULL,
    "page" TEXT,
    "status" TEXT NOT NULL DEFAULT 'New',
    "contactConsent" BOOLEAN NOT NULL DEFAULT false,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "BetaFeedback_userId_status_createdAt_idx"
ON "BetaFeedback"("userId", "status", "createdAt");

CREATE INDEX IF NOT EXISTS "BetaFeedback_authorId_createdAt_idx"
ON "BetaFeedback"("authorId", "createdAt");
