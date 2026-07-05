const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");

const {

    getRepairs,

    getRepair,

    createRepair,

    updateRepair,

    deleteRepair,

} = require("../controllers/repairController");

const router = express.Router();

router.use(authMiddleware);

router.get("/", getRepairs);

router.get("/:id", getRepair);

router.post("/", createRepair);

router.put("/:id", updateRepair);

router.delete("/:id", deleteRepair);

module.exports = router;
