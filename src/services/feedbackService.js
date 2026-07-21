const prisma = require("../lib/prisma");

const CATEGORIES = [
    "Bug",
    "Confusing",
    "Feature request",
    "Praise",
    "General",
];

const STATUSES = [
    "New",
    "Reviewing",
    "Planned",
    "Resolved",
    "Archived",
];

function cleanText(value, maxLength = 2000) {
    if (typeof value !== "string") {
        return "";
    }

    return value.trim().slice(0, maxLength);
}

function cleanRating(value) {
    const rating = Number(value);

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
        return null;
    }

    return rating;
}

function publicFeedback(item) {
    return {
        id: item.id,
        authorName: item.authorName,
        authorEmail: item.authorEmail,
        category: item.category,
        rating: item.rating,
        message: item.message,
        page: item.page,
        status: item.status,
        contactConsent: item.contactConsent,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
    };
}

async function ensureFeedbackSchema() {
    await prisma.$executeRawUnsafe(`
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
        )
    `);

    await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "BetaFeedback_userId_status_createdAt_idx"
        ON "BetaFeedback"("userId", "status", "createdAt")
    `);

    await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "BetaFeedback_authorId_createdAt_idx"
        ON "BetaFeedback"("authorId", "createdAt")
    `);
}

async function createFeedback(workspaceOwnerId, author, data, userAgent) {
    await ensureFeedbackSchema();

    const category = CATEGORIES.includes(data.category)
        ? data.category
        : "General";
    const message = cleanText(data.message);
    const page = cleanText(data.page, 240);
    const rating = cleanRating(data.rating);

    if (message.length < 10) {
        const error = new Error(
            "Please describe the feedback in at least 10 characters."
        );
        error.statusCode = 400;
        throw error;
    }

    const feedback = await prisma.betaFeedback.create({
        data: {
            userId: workspaceOwnerId,
            authorId: author?.memberId || author?.id || null,
            authorName: author?.name || null,
            authorEmail: author?.email || null,
            category,
            rating,
            message,
            page: page || null,
            contactConsent: Boolean(data.contactConsent),
            userAgent: cleanText(userAgent, 400) || null,
        },
    });

    return publicFeedback(feedback);
}

async function listFeedback(workspaceOwnerId, filters = {}) {
    await ensureFeedbackSchema();

    const status = STATUSES.includes(filters.status)
        ? filters.status
        : undefined;
    const category = CATEGORIES.includes(filters.category)
        ? filters.category
        : undefined;

    const rows = await prisma.betaFeedback.findMany({
        where: {
            userId: workspaceOwnerId,
            ...(status ? { status } : {}),
            ...(category ? { category } : {}),
        },
        orderBy: {
            createdAt: "desc",
        },
        take: 200,
    });

    return rows.map(publicFeedback);
}

async function updateFeedbackStatus(workspaceOwnerId, feedbackId, status) {
    await ensureFeedbackSchema();

    if (!STATUSES.includes(status)) {
        const error = new Error("Select a valid feedback status.");
        error.statusCode = 400;
        throw error;
    }

    const existing = await prisma.betaFeedback.findFirst({
        where: {
            id: Number(feedbackId),
            userId: workspaceOwnerId,
        },
    });

    if (!existing) {
        return null;
    }

    const updated = await prisma.betaFeedback.update({
        where: {
            id: existing.id,
        },
        data: {
            status,
        },
    });

    return publicFeedback(updated);
}

module.exports = {
    CATEGORIES,
    STATUSES,
    createFeedback,
    listFeedback,
    updateFeedbackStatus,
};
