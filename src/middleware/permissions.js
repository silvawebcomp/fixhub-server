const requireRole = require("./requireRole");

/*
|--------------------------------------------------------------------------
| Centralized Permission Groups
|--------------------------------------------------------------------------
|
| All application routes should import permissions from this file.
| This ensures authorization rules are defined in one place.
|
*/

const ownerOnly = requireRole([
    "Owner",
]);

const managers = requireRole([
    "Owner",
    "Admin",
]);

const repairEditors = requireRole([
    "Owner",
    "Admin",
    "Technician",
]);

const repairUsers = requireRole([
    "Owner",
    "Admin",
    "Technician",
    "Front Desk",
]);

const customerManagers = requireRole([
    "Owner",
    "Admin",
    "Front Desk",
]);

const inventoryUsers = requireRole([
    "Owner",
    "Admin",
    "Technician",
]);

const inventoryManagers = requireRole([
    "Owner",
    "Admin",
]);

const invoiceUsers = requireRole([
    "Owner",
    "Admin",
    "Front Desk",
]);

const notificationUsers = requireRole([
    "Owner",
    "Admin",
    "Front Desk",
]);

module.exports = {
    ownerOnly,
    managers,
    repairEditors,
    repairUsers,
    customerManagers,
    inventoryUsers,
    inventoryManagers,
    invoiceUsers,
    notificationUsers,
};