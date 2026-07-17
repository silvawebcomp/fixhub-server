const {
    createInvoice,
    getInvoices,
    getInvoice,
    addPayment,
    deleteInvoice,
} = require("../services/invoiceService");

const asyncHandler = require("../middleware/asyncHandler");

function uploadPath(req) {
    return req.file ? `/uploads/invoices/${req.file.filename}` : undefined;
}

async function create(req, res) {
    const invoice = await createInvoice(
        req.user.id,
        {
            ...req.body,
            attachment: uploadPath(req),
        }
    );

    return res.status(201).json(invoice);
}

async function getAll(req, res) {
    const invoices = await getInvoices(
        req.user.id
    );

    return res.json(invoices);
}

async function getOne(req, res) {
    const invoice = await getInvoice(
        req.user.id,
        req.params.id
    );

    if (!invoice) {
        return res.status(404).json({
            message: "Invoice not found.",
        });
    }

    return res.json(invoice);
}

async function recordPayment(req, res) {
    const invoice = await addPayment(
        req.user.id,
        req.params.id,
        req.body
    );

    return res.status(201).json(invoice);
}

async function remove(req, res) {
    const deletedCount = await deleteInvoice(
        req.user.id,
        req.params.id
    );

    if (deletedCount === 0) {
        return res.status(404).json({
            message: "Invoice not found.",
        });
    }

    return res.json({
        message: "Invoice deleted successfully.",
    });
}

module.exports = {
    create: asyncHandler(create),
    getAll: asyncHandler(getAll),
    getOne: asyncHandler(getOne),
    recordPayment: asyncHandler(recordPayment),
    remove: asyncHandler(remove),
};
