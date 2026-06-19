const express = require("express");

const {

    getRepairs,

    createRepair,

    updateRepair,

    deleteRepair,

} = require("../controllers/repairController");

const router = express.Router();

router.get("/", getRepairs);

router.post("/", createRepair);

router.put("/:id", updateRepair);

router.delete("/:id", deleteRepair);

module.exports = router;