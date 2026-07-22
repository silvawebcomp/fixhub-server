CREATE TABLE IF NOT EXISTS "PasswordResetCode" (
    "id" SERIAL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER
);

CREATE INDEX IF NOT EXISTS "PasswordResetCode_email_createdAt_idx"
ON "PasswordResetCode"("email", "createdAt");

CREATE INDEX IF NOT EXISTS "PasswordResetCode_email_expiresAt_idx"
ON "PasswordResetCode"("email", "expiresAt");

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'PasswordResetCode_userId_fkey'
    ) THEN
        ALTER TABLE "PasswordResetCode"
        ADD CONSTRAINT "PasswordResetCode_userId_fkey"
        FOREIGN KEY ("userId") REFERENCES "User"("id")
        ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;
