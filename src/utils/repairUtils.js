const crypto = require("crypto");

function makeTicketNumber() {
    const date = new Date()
        .toISOString()
        .slice(0, 10)
        .replaceAll("-", "");

    const suffix = crypto
        .randomBytes(3)
        .toString("hex")
        .toUpperCase();

    return `FH-${date}-${suffix}`;
}

module.exports = {
    makeTicketNumber,
};