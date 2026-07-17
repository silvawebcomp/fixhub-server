const requireRole = require("./requireRole");

/*
|--------------------------------------------------------------------------
| FixHub Role Matrix
|--------------------------------------------------------------------------
|
| Roles:
| Owner
| Manager
| Technician
| Receptionist
|
*/

const ownerOnly = requireRole([
    "Owner",
]);

const managers = requireRole([
    "Owner",
    "Manager",
]);

const technicians = requireRole([
    "Owner",
    "Manager",
    "Technician",
]);

const reception = requireRole([
    "Owner",
    "Manager",
    "Receptionist",
]);

const repairUsers = requireRole([
    "Owner",
    "Manager",
    "Technician",
    "Receptionist",
]);

const repairEditors = requireRole([
    "Owner",
    "Manager",
    "Technician",
]);

const customerManagers = requireRole([
    "Owner",
    "Manager",
    "Receptionist",
]);

const inventoryUsers = requireRole([
    "Owner",
    "Manager",
    "Technician",
]);

const inventoryManagers = requireRole([
    "Owner",
    "Manager",
]);

const invoiceUsers = requireRole([
    "Owner",
    "Manager",
    "Receptionist",
]);

const notificationUsers = requireRole([
    "Owner",
    "Manager",
    "Receptionist",
]);

module.exports = {
    ownerOnly,
    managers,
    technicians,
    reception,
    repairUsers,
    repairEditors,
    customerManagers,
    inventoryUsers,
    inventoryManagers,
    invoiceUsers,
    notificationUsers,
};