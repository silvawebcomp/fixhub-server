const prisma = require("../lib/prisma");

function cleanText(value) {
    if (typeof value !== "string") {
        return "";
    }

    return value.trim();
}

function isMissingBranchSchema(error) {
    return (
        error?.code === "P2021" ||
        error?.code === "P2022" ||
        /table .*Branch.* does not exist/i.test(error?.message || "") ||
        /column .*branchId.* does not exist/i.test(error?.message || "")
    );
}

async function ensureBranchSchema() {
    await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "Branch" (
            "id" SERIAL PRIMARY KEY,
            "name" TEXT NOT NULL,
            "address" TEXT,
            "phone" TEXT,
            "managerName" TEXT,
            "isDefault" BOOLEAN NOT NULL DEFAULT false,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "userId" INTEGER NOT NULL,
            CONSTRAINT "Branch_userId_fkey"
                FOREIGN KEY ("userId")
                REFERENCES "User"("id")
                ON DELETE RESTRICT
                ON UPDATE CASCADE
        )
    `);

    await prisma.$executeRawUnsafe(`
        CREATE UNIQUE INDEX IF NOT EXISTS "Branch_userId_name_key"
        ON "Branch"("userId", "name")
    `);

    await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "Branch_userId_isDefault_idx"
        ON "Branch"("userId", "isDefault")
    `);

    await prisma.$executeRawUnsafe(`
        ALTER TABLE "Repair"
        ADD COLUMN IF NOT EXISTS "branchId" INTEGER
    `);

    await prisma.$executeRawUnsafe(`
        ALTER TABLE "Inventory"
        ADD COLUMN IF NOT EXISTS "branchId" INTEGER
    `);

    await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "Repair_userId_branchId_idx"
        ON "Repair"("userId", "branchId")
    `);

    await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "Inventory_userId_branchId_idx"
        ON "Inventory"("userId", "branchId")
    `);

    await prisma.$executeRawUnsafe(`
        INSERT INTO "Branch" ("name", "userId", "isDefault", "createdAt", "updatedAt")
        SELECT 'Main Branch', "id", true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        FROM "User"
        ON CONFLICT ("userId", "name") DO NOTHING
    `);

    await prisma.$executeRawUnsafe(`
        UPDATE "Repair" AS r
        SET "branchId" = b."id"
        FROM "Branch" AS b
        WHERE r."branchId" IS NULL
          AND r."userId" = b."userId"
          AND b."isDefault" = true
    `);

    await prisma.$executeRawUnsafe(`
        UPDATE "Inventory" AS i
        SET "branchId" = b."id"
        FROM "Branch" AS b
        WHERE i."branchId" IS NULL
          AND i."userId" = b."userId"
          AND b."isDefault" = true
    `);

    await prisma.$executeRawUnsafe(`
        UPDATE "Repair" AS r
        SET "branchId" = NULL
        WHERE r."branchId" IS NOT NULL
          AND NOT EXISTS (
              SELECT 1
              FROM "Branch" AS b
              WHERE b."id" = r."branchId"
          )
    `);

    await prisma.$executeRawUnsafe(`
        UPDATE "Inventory" AS i
        SET "branchId" = NULL
        WHERE i."branchId" IS NOT NULL
          AND NOT EXISTS (
              SELECT 1
              FROM "Branch" AS b
              WHERE b."id" = i."branchId"
          )
    `);

    await prisma.$executeRawUnsafe(`
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1
                FROM pg_constraint
                WHERE conname = 'Repair_branchId_fkey'
                  AND conrelid = '"Repair"'::regclass
            ) THEN
                ALTER TABLE "Repair"
                ADD CONSTRAINT "Repair_branchId_fkey"
                FOREIGN KEY ("branchId")
                REFERENCES "Branch"("id")
                ON DELETE SET NULL
                ON UPDATE CASCADE;
            END IF;
        END $$;
    `);

    await prisma.$executeRawUnsafe(`
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1
                FROM pg_constraint
                WHERE conname = 'Inventory_branchId_fkey'
                  AND conrelid = '"Inventory"'::regclass
            ) THEN
                ALTER TABLE "Inventory"
                ADD CONSTRAINT "Inventory_branchId_fkey"
                FOREIGN KEY ("branchId")
                REFERENCES "Branch"("id")
                ON DELETE SET NULL
                ON UPDATE CASCADE;
            END IF;
        END $$;
    `);
}

async function retryAfterBranchSchemaRepair(error, operation) {
    if (!isMissingBranchSchema(error)) {
        throw error;
    }

    await ensureBranchSchema();
    return operation();
}

function publicBranch(branch) {
    return {
        id: branch.id,
        name: branch.name,
        address: branch.address,
        phone: branch.phone,
        managerName: branch.managerName,
        isDefault: branch.isDefault,
        createdAt: branch.createdAt,
        updatedAt: branch.updatedAt,
    };
}

function normalizeBranch(data) {
    const name = cleanText(data.name);

    if (!name) {
        throw new Error("Branch name is required.");
    }

    return {
        name,
        address: cleanText(data.address) || null,
        phone: cleanText(data.phone) || null,
        managerName: cleanText(data.managerName) || null,
        isDefault: Boolean(data.isDefault),
    };
}

async function ensureDefaultBranch(workspaceOwnerId) {
    await ensureBranchSchema();

    const operation = async () => {
        const existing = await prisma.branch.findFirst({
            where: {
                userId: workspaceOwnerId,
                isDefault: true,
            },
        });

        if (existing) {
            return existing;
        }

        return prisma.branch.create({
            data: {
                name: "Main Branch",
                userId: workspaceOwnerId,
                isDefault: true,
            },
        });
    };

    try {
        return await operation();
    } catch (error) {
        return retryAfterBranchSchemaRepair(error, operation);
    }
}

async function listBranches(workspaceOwnerId) {
    const operation = async () => {
        await ensureDefaultBranch(workspaceOwnerId);

        const branches = await prisma.branch.findMany({
            where: {
                userId: workspaceOwnerId,
            },
            orderBy: [
                {
                    isDefault: "desc",
                },
                {
                    name: "asc",
                },
            ],
        });

        return branches.map(publicBranch);
    };

    try {
        return await operation();
    } catch (error) {
        return retryAfterBranchSchemaRepair(error, operation);
    }
}

async function createBranch(workspaceOwnerId, data) {
    await ensureBranchSchema();

    const branch = normalizeBranch(data);

    const operation = async () =>
        prisma.$transaction(async (tx) => {
            if (branch.isDefault) {
                await tx.branch.updateMany({
                    where: {
                        userId: workspaceOwnerId,
                        isDefault: true,
                    },
                    data: {
                        isDefault: false,
                    },
                });
            }

            const count = await tx.branch.count({
                where: {
                    userId: workspaceOwnerId,
                },
            });

            const created = await tx.branch.create({
                data: {
                    ...branch,
                    isDefault: branch.isDefault || count === 0,
                    userId: workspaceOwnerId,
                },
            });

            return publicBranch(created);
        });

    try {
        return await operation();
    } catch (error) {
        return retryAfterBranchSchemaRepair(error, operation);
    }
}

async function updateBranch(workspaceOwnerId, branchId, data) {
    await ensureBranchSchema();

    const branch = normalizeBranch(data);

    const existing = await prisma.branch.findFirst({
        where: {
            id: Number(branchId),
            userId: workspaceOwnerId,
        },
    });

    if (!existing) {
        return null;
    }

    return prisma.$transaction(async (tx) => {
        if (branch.isDefault) {
            await tx.branch.updateMany({
                where: {
                    userId: workspaceOwnerId,
                    isDefault: true,
                    NOT: {
                        id: existing.id,
                    },
                },
                data: {
                    isDefault: false,
                },
            });
        }

        const updated = await tx.branch.update({
            where: {
                id: existing.id,
            },
            data: {
                ...branch,
                isDefault: branch.isDefault || existing.isDefault,
            },
        });

        return publicBranch(updated);
    });
}

async function deleteBranch(workspaceOwnerId, branchId) {
    await ensureBranchSchema();

    const existing = await prisma.branch.findFirst({
        where: {
            id: Number(branchId),
            userId: workspaceOwnerId,
        },
        include: {
            _count: {
                select: {
                    repairs: true,
                    inventory: true,
                },
            },
        },
    });

    if (!existing) {
        return null;
    }

    if (existing.isDefault) {
        throw new Error("The default branch cannot be deleted.");
    }

    if (existing._count.repairs || existing._count.inventory) {
        throw new Error("Move repairs and inventory out of this branch before deleting it.");
    }

    await prisma.branch.delete({
        where: {
            id: existing.id,
        },
    });

    return true;
}

async function resolveBranchId(workspaceOwnerId, branchId) {
    await ensureBranchSchema();

    if (branchId === "" || branchId === null || branchId === undefined) {
        const defaultBranch = await ensureDefaultBranch(workspaceOwnerId);
        return defaultBranch?.id || null;
    }

    const parsed = Number(branchId);

    if (!Number.isInteger(parsed)) {
        throw new Error("Select a valid branch.");
    }

    let branch;

    try {
        branch = await prisma.branch.findFirst({
            where: {
                id: parsed,
                userId: workspaceOwnerId,
            },
            select: {
                id: true,
            },
        });
    } catch (error) {
        if (isMissingBranchSchema(error)) {
            return null;
        }

        throw error;
    }

    if (!branch) {
        throw new Error("Selected branch was not found.");
    }

    return branch.id;
}

module.exports = {
    listBranches,
    createBranch,
    updateBranch,
    deleteBranch,
    resolveBranchId,
    ensureDefaultBranch,
    ensureBranchSchema,
};
