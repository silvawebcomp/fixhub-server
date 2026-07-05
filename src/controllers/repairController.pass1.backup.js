const crypto = require("crypto");
const prisma = require("../lib/prisma");

const REPAIR_STATUSES = [
    "Received",
    "Diagnosing",
    "Awaiting Approval",
    "Awaiting Parts",
    "Repairing",
    "Ready",
    "Collected",
    "Cancelled",
];

const REPAIR_PRIORITIES = ["Low", "Normal", "High", "Urgent"];

function cleanOptionalText(value) {
    if (typeof value !== "string") {
        return null;
    }

    const cleaned = value.trim();
    return cleaned || null;
}

function parseOptionalNumber(value) {
    if (value === "" || value === null || value === undefined) {
        return null;
    }

    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : NaN;
}

function parseOptionalDate(value) {
    if (!value) {
        return null;
    }

    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

function makeTicketNumber() {
    const date = new Date().toISOString().slice(0, 10).replaceAll("-", "");
    const suffix = crypto.randomBytes(3).toString("hex").toUpperCase();
    return `FH-${date}-${suffix}`;
}

function validateRepair(body) {
    const customer = typeof body.customer === "string" ? body.customer.trim() : "";
    const device = typeof body.device === "string" ? body.device.trim() : "";
    const status = body.status || "Received";
    const priority = body.priority || "Normal";
    const estimatedCost = parseOptionalNumber(body.estimatedCost);
    const finalCost = parseOptionalNumber(body.finalCost);
    const dueDate = parseOptionalDate(body.dueDate);

    if (!customer || !device) {
        return { error: "Customer and device are required." };
    }

    if (!REPAIR_STATUSES.includes(status)) {
        return { error: "Select a valid repair status." };
    }

    if (!REPAIR_PRIORITIES.includes(priority)) {
        return { error: "Select a valid repair priority." };
    }

    if (Number.isNaN(estimatedCost) || Number.isNaN(finalCost)) {
        return { error: "Repair costs must be valid positive numbers." };
    }

    if (dueDate === undefined) {
        return { error: "Due date is invalid." };
    }

    return {
        data: {
            customer,
            customerPhone: cleanOptionalText(body.customerPhone),
            customerEmail: cleanOptionalText(body.customerEmail),
            device,
            deviceBrand: cleanOptionalText(body.deviceBrand),
            deviceModel: cleanOptionalText(body.deviceModel),
            serialNumber: cleanOptionalText(body.serialNumber),
            issue: cleanOptionalText(body.issue),
            status,
            priority,
            assignedTechnician: cleanOptionalText(body.assignedTechnician),
            estimatedCost,
            finalCost,
            dueDate,
            notes: cleanOptionalText(body.notes),
        },
    };
}

async function getRepairs(req, res) {
    try {
        const repairs = await repairService.getRepairs(req.user.id);

        return res.json(repairs);
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            message: "Failed to fetch repairs",
        });
    }
}

async function getRepair(req, res) {
    try {
        const id = Number(req.params.id);
        const repair = await prisma.repair.findFirst({
            where: { id, userId: req.user.id },
            include: {
                statusHistory: {
                    orderBy: { createdAt: "desc" },
                },
            },
        });

        if (!repair) {
            return res.status(404).json({ message: "Repair not found" });
        }

        res.json(repair);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to fetch repair" });
    }
}

async function createRepair(req, res) {
    try {
        const validation = validateRepair(req.body);

        if (validation.error) {
            return res.status(400).json({ message: validation.error });
        }

        const repair = await prisma.repair.create({
            data: {
                ...validation.data,
                ticketNumber: makeTicketNumber(),
                completedAt: validation.data.status === "Collected" ? new Date() : null,
                userId: req.user.id,
                statusHistory: {
                    create: {
                        status: validation.data.status,
                        note: cleanOptionalText(req.body.statusNote) || "Repair ticket created",
                    },
                },
            },
            include: {
                statusHistory: {
                    orderBy: { createdAt: "desc" },
                },
            },
        });

        res.status(201).json(repair);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to create repair" });
    }
}

async function updateRepair(req, res) {
    try {
        const id = Number(req.params.id);
        const validation = validateRepair(req.body);

        if (validation.error) {
            return res.status(400).json({ message: validation.error });
        }

        const existing = await prisma.repair.findFirst({
            where: { id, userId: req.user.id },
        });

        if (!existing) {
            return res.status(404).json({ message: "Repair not found" });
        }

        const statusChanged = existing.status !== validation.data.status;
        const completedAt =
            validation.data.status === "Collected"
                ? existing.completedAt || new Date()
                : null;

        const repair = await prisma.repair.update({
            where: { id },
            data: {
                ...validation.data,
                completedAt,
                ...(statusChanged
                    ? {
                          statusHistory: {
                              create: {
                                  status: validation.data.status,
                                  note: cleanOptionalText(req.body.statusNote),
                              },
                          },
                      }
                    : {}),
            },
            include: {
                statusHistory: {
                    orderBy: { createdAt: "desc" },
                },
            },
        });

        res.json(repair);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to update repair" });
    }
}

async function deleteRepair(req, res) {
    try {
        const id = Number(req.params.id);
        const deleted = await prisma.repair.deleteMany({
            where: { id, userId: req.user.id },
        });

        if (deleted.count === 0) {
            return res.status(404).json({ message: "Repair not found" });
        }

        res.json({ message: "Repair deleted" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to delete repair" });
    }
}

module.exports = {
    getRepairs,
    getRepair,
    createRepair,
    updateRepair,
    deleteRepair,
};
