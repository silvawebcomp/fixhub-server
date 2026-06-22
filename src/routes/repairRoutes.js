const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");

const {

    getRepairs,

    createRepair,

    updateRepair,

    deleteRepair,

} = require("../controllers/repairController");

const router = express.Router();

router.use(authMiddleware);

router.get("/", getRepairs);

router.post("/", createRepair);

router.put("/:id", updateRepair);

router.delete("/:id", deleteRepair);

module.exports = router;
