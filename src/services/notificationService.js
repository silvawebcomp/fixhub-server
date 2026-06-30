const prisma = require("../lib/prisma");

const CHANNELS = ["WhatsApp", "SMS", "Email"];
const STATUSES = ["Prepared", "Sent", "Failed"];

function cleanText(value) {
    if (typeof value !== "string") {
        return null;
    }

    const cleaned = value.trim();
    return cleaned || null;
}

function firstAvailable(...values) {
    return values.find((value) => typeof value === "string" && value.trim()) || "";
}

function trackingLink(repair) {
    const clientUrl = process.env.CLIENT_URL || "https://fixhub-client.vercel.app";
    const ticket = repair.ticketNumber ? `?ticket=${encodeURIComponent(repair.ticketNumber)}` : "";

    return `${clientUrl.replace(/\/$/, "")}/track${ticket}`;
}

function buildTemplate(repair, type = "status") {
    const ticketLabel = repair.ticketNumber || `Repair #${repair.id}`;
    const deviceName = [
        repair.deviceBrand,
        repair.deviceModel,
        repair.device,
    ]
        .filter(Boolean)
        .join(" ");
    const link = trackingLink(repair);

    const templates = {
        status: {
            subject: `Repair update for ${ticketLabel}`,
            message: `Hello ${repair.customer}, your ${deviceName} repair is now: ${repair.status}. Track progress here: ${link}`,
        },
        approval: {
            subject: `Approval needed for ${ticketLabel}`,
            message: `Hello ${repair.customer}, your ${deviceName} repair needs your approval before we continue. Please contact FixHub or track it here: ${link}`,
        },
        ready: {
            subject: `Your repair is ready for pickup`,
            message: `Hello ${repair.customer}, your ${deviceName} repair is ready for pickup. Ticket: ${ticketLabel}. Track details here: ${link}`,
        },
        payment: {
            subject: `Payment update for ${ticketLabel}`,
            message: `Hello ${repair.customer}, your ${deviceName} repair has a payment update. Please contact FixHub or check the repair progress here: ${link}`,
        },
    };

    return templates[type] || templates.status;
}

async function getRepairForUser(userId, repairId) {
    const repair = await prisma.repair.findFirst({
        where: {
            id: Number(repairId),
            userId,
        },
    });

    if (!repair) {
        throw new Error("Repair not found.");
    }

    return repair;
}

async function getNotificationDraft(userId, repairId, templateType) {
    const repair = await getRepairForUser(userId, repairId);
    const template = buildTemplate(repair, templateType);

    return {
        repair,
        subject: template.subject,
        message: template.message,
        recipients: {
            WhatsApp: repair.customerPhone || "",
            SMS: repair.customerPhone || "",
            Email: repair.customerEmail || "",
        },
        trackingUrl: trackingLink(repair),
    };
}

async function createNotificationLog(userId, data) {
    const channel = cleanText(data.channel);
    const recipient = cleanText(data.recipient);
    const message = cleanText(data.message);
    const status = cleanText(data.status) || "Prepared";
    const repairId = data.repairId ? Number(data.repairId) : null;

    if (!channel || !CHANNELS.includes(channel)) {
        throw new Error("Select a valid notification channel.");
    }

    if (!recipient) {
        throw new Error("A recipient is required.");
    }

    if (!message) {
        throw new Error("A message is required.");
    }

    if (!STATUSES.includes(status)) {
        throw new Error("Select a valid notification status.");
    }

    if (repairId) {
        await getRepairForUser(userId, repairId);
    }

    try {
        return await prisma.notificationLog.create({
            data: {
                userId,
                repairId,
                channel,
                recipient,
                subject: cleanText(data.subject),
                message,
                status,
            },
            include: {
                repair: true,
            },
        });
    } catch (error) {
        if (error.code === "P2021" || error.code === "P2022") {
            throw new Error(
                "Communication logs are not ready yet. Run the latest database migration."
            );
        }

        throw error;
    }
}

async function getNotificationLogs(userId, repairId) {
    try {
        return await prisma.notificationLog.findMany({
            where: {
                userId,
                ...(repairId
                    ? {
                          repairId: Number(repairId),
                      }
                    : {}),
            },
            include: {
                repair: true,
            },
            orderBy: {
                createdAt: "desc",
            },
        });
    } catch (error) {
        if (error.code === "P2021" || error.code === "P2022") {
            return [];
        }

        throw error;
    }
}

function buildLaunchUrls({ channel, recipient, subject, message }) {
    const encodedMessage = encodeURIComponent(message);
    const encodedSubject = encodeURIComponent(firstAvailable(subject, "FixHub update"));
    const normalizedPhone = recipient.replace(/[^\d+]/g, "");

    return {
        WhatsApp: `https://wa.me/${normalizedPhone.replace(/^\+/, "")}?text=${encodedMessage}`,
        SMS: `sms:${normalizedPhone}?&body=${encodedMessage}`,
        Email: `mailto:${recipient}?subject=${encodedSubject}&body=${encodedMessage}`,
    }[channel];
}

module.exports = {
    CHANNELS,
    getNotificationDraft,
    createNotificationLog,
    getNotificationLogs,
    buildLaunchUrls,
};
