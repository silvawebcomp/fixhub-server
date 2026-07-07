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

const REPAIR_PRIORITIES = [
    "Low",
    "Normal",
    "High",
    "Urgent",
];

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

    return Number.isFinite(parsed) && parsed >= 0
        ? parsed
        : NaN;
}

function parseOptionalDate(value) {
    if (!value) {
        return null;
    }

    const parsed = new Date(value);

    return Number.isNaN(parsed.getTime())
        ? undefined
        : parsed;
}

function validateRepair(body) {
    const customer =
        typeof body.customer === "string"
            ? body.customer.trim()
            : "";

    const device =
        typeof body.device === "string"
            ? body.device.trim()
            : "";

    const status = body.status || "Received";
    const priority = body.priority || "Normal";

    const estimatedCost =
        parseOptionalNumber(body.estimatedCost);

    const finalCost =
        parseOptionalNumber(body.finalCost);

    const dueDate =
        parseOptionalDate(body.dueDate);

    if (!customer || !device) {
        throw new Error(
            "Customer and device are required."
        );
    }

    if (!REPAIR_STATUSES.includes(status)) {
        throw new Error(
            "Select a valid repair status."
        );
    }

    if (!REPAIR_PRIORITIES.includes(priority)) {
        throw new Error(
            "Select a valid repair priority."
        );
    }

    if (
        Number.isNaN(estimatedCost) ||
        Number.isNaN(finalCost)
    ) {
        throw new Error(
            "Repair costs must be valid positive numbers."
        );
    }

    if (dueDate === undefined) {
        throw new Error(
            "Due date is invalid."
        );
    }

    return {
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
    };
}

module.exports = {
    REPAIR_STATUSES,
    REPAIR_PRIORITIES,
    cleanOptionalText,
    parseOptionalNumber,
    parseOptionalDate,
    validateRepair,
};