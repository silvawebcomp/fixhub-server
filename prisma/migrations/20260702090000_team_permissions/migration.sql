ALTER TABLE "User"
ADD COLUMN "role" TEXT NOT NULL DEFAULT 'Owner',
ADD COLUMN "workspaceOwnerId" INTEGER;

CREATE INDEX "User_workspaceOwnerId_idx" ON "User"("workspaceOwnerId");
CREATE INDEX "User_role_idx" ON "User"("role");

ALTER TABLE "User"
ADD CONSTRAINT "User_workspaceOwnerId_fkey"
FOREIGN KEY ("workspaceOwnerId") REFERENCES "User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
