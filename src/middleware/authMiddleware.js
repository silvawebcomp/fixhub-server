const prisma = require("../lib/prisma");
const { verifyToken } = require("../utils/jwt");

function isMissingColumnError(error) {
    return error?.code === "P2022" ||
        /column .* does not exist/i.test(error?.message || "");
}

function normalizeUser(user, fallbackRole = "Owner") {
    if (!user) {
        return null;
    }

    return {
        ...user,
        role: user.role || fallbackRole,
        workspaceOwnerId: user.workspaceOwnerId || null,
    };
}

async function findAuthenticatedUser(payload) {
    try {
        return normalizeUser(
            await prisma.user.findUnique({
                where: {
                    id: payload.id,
                },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    workspaceOwnerId: true,
                },
            }),
            payload.role
        );
    } catch (error) {
        if (!isMissingColumnError(error)) {
            throw error;
        }

        const rows = await prisma.$queryRaw`
            SELECT "id", "name", "email"
            FROM "User"
            WHERE "id" = ${payload.id}
            LIMIT 1
        `;

        return normalizeUser(rows[0], payload.role);
    }
}

async function authMiddleware(req, res, next) {
    const header = req.headers.authorization;
    const token = header && header.startsWith("Bearer ")
        ? header.slice(7)
        : null;

    if (!token) {
        return res.status(401).json({
            message: "Authentication required",
        });
    }

    try {
        const payload = verifyToken(token);
        const user = await findAuthenticatedUser(payload);

        if (!user) {
            return res.status(401).json({
                message: "Invalid or expired token",
            });
        }

        const workspaceOwnerId = user.workspaceOwnerId || user.id;

        req.user = {
            ...user,
            memberId: user.id,
            id: workspaceOwnerId,
            workspaceOwnerId,
        };

        return next();
    } catch (error) {
        return res.status(401).json({
            message: "Invalid or expired token",
        });
    }
}

module.exports = authMiddleware;
