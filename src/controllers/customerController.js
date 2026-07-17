const customerService = require("../services/customerService");
const asyncHandler = require("../middleware/asyncHandler");

function uploadPath(req) {
    return req.file ? `/uploads/customers/${req.file.filename}` : undefined;
}

async function getCustomers(req, res) {
    try {
        const customers = await customerService.getCustomers(req.user.id);

        res.json(customers);
    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to fetch customers",
        });
    }
}

async function createCustomer(req, res) {
    try {
        const { name, email, phone } = req.body;

        const customer = await customerService.createCustomer(
            name,
            email,
            phone,
            req.user.id,
            uploadPath(req)
        );

        res.status(201).json(customer);
    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to create customer",
        });
    }
}

async function updateCustomer(req, res) {
    try {
        const id = Number(req.params.id);

        const { name, email, phone } = req.body;

        const customer = await customerService.updateCustomer(
            id,
            req.user.id,
            name,
            email,
            phone,
            uploadPath(req)
        );

        if (!customer) {
            return res.status(404).json({
                message: "Customer not found",
            });
        }

        res.json(customer);
    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to update customer",
        });
    }
}

async function deleteCustomer(req, res) {
    try {
        const id = Number(req.params.id);

        const deleted = await customerService.deleteCustomer(id, req.user.id);

        if (deleted.count === 0) {
            return res.status(404).json({
                message: "Customer not found",
            });
        }

        res.json({
            message: "Customer deleted",
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to delete customer",
        });
    }
}

module.exports = {
    getCustomers: asyncHandler(getCustomers),
    createCustomer: asyncHandler(createCustomer),
    updateCustomer: asyncHandler(updateCustomer),
    deleteCustomer: asyncHandler(deleteCustomer),
};
