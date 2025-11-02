const express = require("express");
const router = express.Router();
const { createSession } = require("../controllers/sessionController");

// Route for POST /api/sessions/create
router.post("/create", createSession);

module.exports = router;
