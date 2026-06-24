const prisma = require("../lib/prisma");

function normalizePhone(value) {
    return String(value || "").replace(/\D/g, "");
}

function normalizeEmail(value) {
    return String(value || "").trim().toLowerCase();
}

function contactMatches(repair, contact) {
    const suppliedEmail = normalizeEmail(contact);
    const storedEmail = normalizeEmail(repair.customerEmail);

    if (suppliedEmail.includes("@")) {
        return Boolean(storedEmail && suppliedEmail === storedEmail);
    }

    const suppliedPhone = normalizePhone(contact);
    const storedPhone = normalizePhone(repair.customerPhone);

    if (!suppliedPhone || !storedPhone) {
        return false;
    }

    const comparisonLength = Math.min(10, suppliedPhone.length, storedPhone.length);

    return (
        comparisonLength >= 7 &&
        suppliedPhone.slice(-comparisonLength) === storedPhone.slice(-comparisonLength)
    );
}

async function trackRepair(req, res) {
    try {
        const ticketNumber = String(req.body.ticketNumber || "")
            .trim()
            .toUpperCase();
        const contact = String(req.body.contact || "").trim();

        if (!ticketNumber || !contact) {
            return res.status(400).json({
                message: "Enter your ticket number and phone number or email.",
            });
        }

        const repair = await prisma.repair.findUnique({
            where: { ticketNumber },
            include: {
                statusHistory: {
                    orderBy: { createdAt: "asc" },
                    select: {
                        id: true,
                        status: true,
                        createdAt: true,
                    },
                },
            },
        });

        if (!repair || !contactMatches(repair, contact)) {
            return res.status(404).json({
                message:
                    "We could not match that ticket and contact detail. Check both entries and try again.",
            });
        }

        res.json({
            ticketNumber: repair.ticketNumber,
            customer: repair.customer,
            device: repair.device,
            deviceBrand: repair.deviceBrand,
            deviceModel: repair.deviceModel,
            issue: repair.issue,
            status: repair.status,
            estimatedCost: repair.estimatedCost,
            finalCost: repair.finalCost,
            dueDate: repair.dueDate,
            completedAt: repair.completedAt,
            createdAt: repair.createdAt,
            updatedAt: repair.updatedAt,
            statusHistory: repair.statusHistory,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Unable to check this repair right now. Please try again.",
        });
    }
}

module.exports = {
    trackRepair,
};
