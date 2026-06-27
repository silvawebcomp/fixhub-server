const express = require("express");

const authMiddleware = require("../middleware/authMiddleware");

const {
    create,
    getAll,
    getOne,
    recordPayment,
    remove,
} = require("../controllers/invoiceController");

const router = express.Router();

router.use(authMiddleware);

router.get("/", getAll);

router.get("/:id", getOne);

router.post("/", create);

router.post("/:id/payments", recordPayment);

router.delete("/:id", remove);

module.exports = router;
