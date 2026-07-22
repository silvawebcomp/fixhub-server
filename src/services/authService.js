const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const prisma = require("../lib/prisma");
const {
    buildPasswordChangedEmail,
    buildResetCodeEmail,
    isEmailConfigured,
    sendEmail,
} = require("./mailService");

const {

    generateToken,

} = require("../utils/jwt");

function isMissingColumnError(error) {
    return error?.code === "P2022" ||
        /column .* does not exist/i.test(error?.message || "");
}

function normalizeUser(user) {
    if (!user) {
        return null;
    }

    return {
        ...user,
        role: user.role || "Owner",
        workspaceOwnerId: user.workspaceOwnerId || null,
    };
}

function normalizeEmail(email = "") {
    return String(email).trim().toLowerCase();
}

function maskEmail(email = "") {
    const [name = "", domain = ""] = normalizeEmail(email).split("@");

    if (!domain) {
        return "";
    }

    const visible = name.slice(0, 2);
    return `${visible}${"*".repeat(Math.max(name.length - 2, 4))}@${domain}`;
}

function getResetSecret() {
    return process.env.PASSWORD_RESET_SECRET || process.env.JWT_SECRET || "fixhub-password-reset";
}

function hashResetCode(email, code) {
    return crypto
        .createHmac("sha256", getResetSecret())
        .update(`${normalizeEmail(email)}:${code}`)
        .digest("hex");
}

function generateResetCode() {
    return String(crypto.randomInt(0, 1000000)).padStart(6, "0");
}

function getResetTtlMinutes() {
    const value = Number(process.env.PASSWORD_RESET_TTL_MINUTES || 10);
    return Number.isFinite(value) && value > 0 ? value : 10;
}

async function ensurePasswordResetSchema() {
    await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "PasswordResetCode" (
            "id" SERIAL PRIMARY KEY,
            "email" TEXT NOT NULL,
            "codeHash" TEXT NOT NULL,
            "attempts" INTEGER NOT NULL DEFAULT 0,
            "expiresAt" TIMESTAMP(3) NOT NULL,
            "usedAt" TIMESTAMP(3),
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "userId" INTEGER
        )
    `);

    await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "PasswordResetCode_email_createdAt_idx"
        ON "PasswordResetCode"("email", "createdAt")
    `);

    await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "PasswordResetCode_email_expiresAt_idx"
        ON "PasswordResetCode"("email", "expiresAt")
    `);
}

async function findUserByEmail(email) {
    try {
        return normalizeUser(
            await prisma.user.findUnique({
                where: {
                    email,
                },
            })
        );
    } catch (error) {
        if (!isMissingColumnError(error)) {
            throw error;
        }

        const rows = await prisma.$queryRaw`
            SELECT "id", "name", "email", "password", "createdAt"
            FROM "User"
            WHERE "email" = ${email}
            LIMIT 1
        `;

        return normalizeUser(rows[0]);
    }
}

async function createResetRecord(data) {
    try {
        return await prisma.passwordResetCode.create({
            data,
        });
    } catch (error) {
        if (!isMissingColumnError(error) && error?.code !== "P2021") {
            throw error;
        }

        await ensurePasswordResetSchema();
        const rows = await prisma.$queryRaw`
            INSERT INTO "PasswordResetCode" ("email", "codeHash", "expiresAt", "userId")
            VALUES (${data.email}, ${data.codeHash}, ${data.expiresAt}, ${data.userId})
            RETURNING "id", "email", "codeHash", "attempts", "expiresAt", "usedAt", "createdAt", "userId"
        `;

        return rows[0];
    }
}

async function findLatestResetRecord(email) {
    try {
        return await prisma.passwordResetCode.findFirst({
            where: {
                email,
                usedAt: null,
                expiresAt: {
                    gt: new Date(),
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        });
    } catch (error) {
        if (!isMissingColumnError(error) && error?.code !== "P2021") {
            throw error;
        }

        await ensurePasswordResetSchema();
        const rows = await prisma.$queryRaw`
            SELECT "id", "email", "codeHash", "attempts", "expiresAt", "usedAt", "createdAt", "userId"
            FROM "PasswordResetCode"
            WHERE "email" = ${email}
              AND "usedAt" IS NULL
              AND "expiresAt" > NOW()
            ORDER BY "createdAt" DESC
            LIMIT 1
        `;

        return rows[0] || null;
    }
}

async function incrementResetAttempts(id) {
    try {
        await prisma.passwordResetCode.update({
            where: { id },
            data: {
                attempts: {
                    increment: 1,
                },
            },
        });
    } catch (error) {
        if (!isMissingColumnError(error) && error?.code !== "P2021") {
            throw error;
        }

        await ensurePasswordResetSchema();
        await prisma.$executeRaw`
            UPDATE "PasswordResetCode"
            SET "attempts" = "attempts" + 1
            WHERE "id" = ${id}
        `;
    }
}

async function markResetUsed(id) {
    try {
        await prisma.passwordResetCode.update({
            where: { id },
            data: {
                usedAt: new Date(),
            },
        });
    } catch (error) {
        if (!isMissingColumnError(error) && error?.code !== "P2021") {
            throw error;
        }

        await ensurePasswordResetSchema();
        await prisma.$executeRaw`
            UPDATE "PasswordResetCode"
            SET "usedAt" = CURRENT_TIMESTAMP
            WHERE "id" = ${id}
        `;
    }
}

async function updateUserPassword(userId, hashedPassword) {
    await prisma.user.update({
        where: {
            id: userId,
        },
        data: {
            password: hashedPassword,
        },
    });
}

async function createOwnerUser({
    name,
    email,
    password,
}) {
    try {
        return normalizeUser(
            await prisma.user.create({
                data: {
                    name,
                    email,
                    password,
                    role: "Owner",
                },
            })
        );
    } catch (error) {
        if (!isMissingColumnError(error)) {
            throw error;
        }

        const rows = await prisma.$queryRaw`
            INSERT INTO "User" ("name", "email", "password", "createdAt")
            VALUES (${name}, ${email}, ${password}, CURRENT_TIMESTAMP)
            RETURNING "id", "name", "email", "password", "createdAt"
        `;

        return normalizeUser(rows[0]);
    }
}

async function register({

    name,

    email,

    password,

}) {

    const existingUser = await findUserByEmail(email);

    if (existingUser) {

        throw new Error(

            "User already exists"

        );

    }

    const hashedPassword = await bcrypt.hash(

        password,

        10

    );

    const user = await createOwnerUser({
        name,
        email,
        password: hashedPassword,
    });

    const token = generateToken({

        id: user.id,

        email: user.email,

        role: user.role,

    });

    return {

        token,

        user: {

            id: user.id,

            name: user.name,

            email: user.email,

            role: user.role,

        },

    };

}

async function login({

    email,

    password,

}) {

    const user = await findUserByEmail(email);

    if (!user) {

        throw new Error(

            "Invalid email or password"

        );

    }

    const validPassword = await bcrypt.compare(

        password,

        user.password

    );

    if (!validPassword) {

        throw new Error(

            "Invalid email or password"

        );

    }

    const token = generateToken({

        id: user.id,

        email: user.email,

        role: user.role,

    });

    return {

        token,

        user: {

            id: user.id,

            name: user.name,

            email: user.email,

            role: user.role,

        },

    };

}

async function requestPasswordReset({ email }) {
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail) {
        throw new Error("Email address is required.");
    }

    await ensurePasswordResetSchema();

    if (!isEmailConfigured() && process.env.NODE_ENV === "production") {
        throw new Error("Password reset email is not configured yet.");
    }

    const genericResponse = {
        message: "If an account exists for that email, a reset code has been sent.",
        maskedEmail: maskEmail(normalizedEmail),
        expiresInMinutes: getResetTtlMinutes(),
    };

    const user = await findUserByEmail(normalizedEmail);

    if (!user) {
        return genericResponse;
    }

    const code = generateResetCode();
    const ttlMinutes = getResetTtlMinutes();
    const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);

    await createResetRecord({
        email: normalizedEmail,
        codeHash: hashResetCode(normalizedEmail, code),
        expiresAt,
        userId: user.id,
    });

    const emailMessage = buildResetCodeEmail({
        name: user.name,
        code,
        ttlMinutes,
    });

    await sendEmail({
        to: normalizedEmail,
        ...emailMessage,
    });

    return genericResponse;
}

async function resetPassword({ email, code, password }) {
    const normalizedEmail = normalizeEmail(email);
    const normalizedCode = String(code || "").replace(/\D/g, "");

    if (!normalizedEmail || normalizedCode.length !== 6) {
        throw new Error("Enter the email address and six-digit reset code.");
    }

    if (!password || password.length < 8) {
        throw new Error("New password must be at least 8 characters.");
    }

    await ensurePasswordResetSchema();

    const user = await findUserByEmail(normalizedEmail);
    const resetRecord = await findLatestResetRecord(normalizedEmail);

    if (!user || !resetRecord || resetRecord.attempts >= 5) {
        throw new Error("Invalid or expired reset code.");
    }

    const codeHash = hashResetCode(normalizedEmail, normalizedCode);

    if (codeHash !== resetRecord.codeHash) {
        await incrementResetAttempts(resetRecord.id);
        throw new Error("Invalid or expired reset code.");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await updateUserPassword(user.id, hashedPassword);
    await markResetUsed(resetRecord.id);

    const emailMessage = buildPasswordChangedEmail({
        name: user.name,
    });

    await sendEmail({
        to: normalizedEmail,
        ...emailMessage,
    });

    return {
        message: "Password updated successfully. Sign in with your new password.",
    };
}

module.exports = {

    register,

    login,

    requestPasswordReset,

    resetPassword,

};
