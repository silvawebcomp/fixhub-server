const {
    createInvoice,
    getInvoices,
    getInvoice,
    addPayment,
    deleteInvoice,
} = require("../services/invoiceService");

async function create(req, res) {
    try {
        const invoice = await createInvoice(req.user.id, req.body);

        return res.status(201).json(invoice);
    } catch (error) {
        console.error(error);

        return res.status(400).json({
            message: error.message,
        });
    }
}

async function getAll(req, res) {
    try {
        const invoices = await getInvoices(req.user.id);

        return res.json(invoices);
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            message: "Unable to fetch invoices.",
        });
    }
}

async function getOne(req, res) {
    try {
        const invoice = await getInvoice(req.user.id, req.params.id);

        if (!invoice) {
            return res.status(404).json({
                message: "Invoice not found.",
            });
        }

        return res.json(invoice);
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            message: "Unable to fetch invoice.",
        });
    }
}

async function recordPayment(req, res) {
    try {
        const invoice = await addPayment(req.user.id, req.params.id, req.body);

        return res.status(201).json(invoice);
    } catch (error) {
        console.error(error);

        return res.status(400).json({
            message: error.message,
        });
    }
}

async function remove(req, res) {
    try {
        const deletedCount = await deleteInvoice(req.user.id, req.params.id);

        if (deletedCount === 0) {
            return res.status(404).json({
                message: "Invoice not found.",
            });
        }

        return res.json({
            message: "Invoice deleted successfully.",
        });
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            message: "Unable to delete invoice.",
        });
    }
}

module.exports = {
    create,
    getAll,
    getOne,
    recordPayment,
    remove,
};
