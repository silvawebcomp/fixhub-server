const prisma = require("../lib/prisma");
const { verifyToken } = require("../utils/jwt");

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
        const user = await prisma.user.findUnique({
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
        });

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
