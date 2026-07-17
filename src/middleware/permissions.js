const requireRole = require("./requireRole");

/*
|--------------------------------------------------------------------------
| FixHub Role Matrix
|--------------------------------------------------------------------------
|
| Roles:
| Owner
| Admin / Manager
| Manager
| Technician
| Front Desk / Receptionist
|
*/

const ownerOnly = requireRole([
    "Owner",
]);

const managers = requireRole([
    "Owner",
    "Admin",
    "Manager",
]);

const technicians = requireRole([
    "Owner",
    "Admin",
    "Manager",
    "Technician",
]);

const reception = requireRole([
    "Owner",
    "Admin",
    "Manager",
    "Front Desk",
    "Receptionist",
]);

const repairUsers = requireRole([
    "Owner",
    "Admin",
    "Manager",
    "Technician",
    "Front Desk",
    "Receptionist",
]);

const repairEditors = requireRole([
    "Owner",
    "Admin",
    "Manager",
    "Technician",
]);

const customerManagers = requireRole([
    "Owner",
    "Admin",
    "Manager",
    "Front Desk",
    "Receptionist",
]);

const inventoryUsers = requireRole([
    "Owner",
    "Admin",
    "Manager",
    "Technician",
]);

const inventoryManagers = requireRole([
    "Owner",
    "Admin",
    "Manager",
]);

const invoiceUsers = requireRole([
    "Owner",
    "Admin",
    "Manager",
    "Front Desk",
    "Receptionist",
]);

const notificationUsers = requireRole([
    "Owner",
    "Admin",
    "Manager",
    "Front Desk",
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
