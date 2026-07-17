const bcrypt = require("bcryptjs");
const prisma = require("../lib/prisma");

const TEAM_ROLES = [
    "Owner",
    "Admin",
    "Manager",
    "Technician",
    "Front Desk",
    "Receptionist",
];

function cleanText(value) {
    if (typeof value !== "string") {
        return "";
    }

    return value.trim();
}

function publicUser(user) {
    return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        isOwner: !user.workspaceOwnerId,
    };
}

function validateRole(role) {
    if (!TEAM_ROLES.includes(role) || role === "Owner") {
        throw new Error("Select a valid teammate role.");
    }
}

async function listTeam(workspaceOwnerId) {
    const users = await prisma.user.findMany({
        where: {
            OR: [
                {
                    id: workspaceOwnerId,
                },
                {
                    workspaceOwnerId,
                },
            ],
        },
        orderBy: [
            {
                workspaceOwnerId: "asc",
            },
            {
                createdAt: "asc",
            },
        ],
    });

    return users.map(publicUser);
}

async function createTeamMember(workspaceOwnerId, data) {
    const name = cleanText(data.name);
    const email = cleanText(data.email).toLowerCase();
    const password = cleanText(data.password);
    const role = cleanText(data.role);

    if (!name || !email || !password) {
        throw new Error(
            "Name, email, and password are required."
        );
    }

    if (password.length < 6) {
        throw new Error(
            "Password must be at least 6 characters."
        );
    }

    validateRole(role);

    const existing = await prisma.user.findUnique({
        where: {
            email,
        },
    });

    if (existing) {
        throw new Error(
            "A user with this email already exists."
        );
    }

    const hashedPassword = await bcrypt.hash(
        password,
        10
    );

    const user = await prisma.user.create({
        data: {
            name,
            email,
            password: hashedPassword,
            role,
            workspaceOwnerId,
        },
    });

    return publicUser(user);
}

async function updateTeamMember(
    workspaceOwnerId,
    memberId,
    data
) {
    const role = cleanText(data.role);

    validateRole(role);

    const member = await prisma.user.findFirst({
        where: {
            id: Number(memberId),
            workspaceOwnerId,
        },
    });

    if (!member) {
        return null;
    }

    const updated = await prisma.user.update({
        where: {
            id: member.id,
        },
        data: {
            role,
        },
    });

    return publicUser(updated);
}

async function deleteTeamMember(
    workspaceOwnerId,
    memberId
) {
    return prisma.user.deleteMany({
        where: {
            id: Number(memberId),
            workspaceOwnerId,
        },
    });
}

module.exports = {
    TEAM_ROLES,
    listTeam,
    createTeamMember,
    updateTeamMember,
    deleteTeamMember,
};
