const prisma = require("../lib/prisma");

function cleanText(value) {
    if (typeof value !== "string") {
        return "";
    }

    return value.trim();
}

function isMissingBranchTable(error) {
    return (
        error?.code === "P2021" ||
        /table .*Branch.* does not exist/i.test(error?.message || "")
    );
}

async function ensureBranchTable() {
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
}

async function retryAfterBranchTableCreate(error, operation) {
    if (!isMissingBranchTable(error)) {
        throw error;
    }

    await ensureBranchTable();
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
        return retryAfterBranchTableCreate(error, operation);
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
        return retryAfterBranchTableCreate(error, operation);
    }
}

async function createBranch(workspaceOwnerId, data) {
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
        return retryAfterBranchTableCreate(error, operation);
    }
}

async function updateBranch(workspaceOwnerId, branchId, data) {
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
        if (isMissingBranchTable(error)) {
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
};
