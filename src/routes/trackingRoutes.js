const express = require("express");
const { trackRepair } = require("../controllers/trackingController");

const router = express.Router();

router.post("/", trackRepair);

module.exports = router;
