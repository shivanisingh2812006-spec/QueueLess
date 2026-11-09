
const express = require("express");
const router = express.Router();
const Token = require("../models/Token");

// Generate a new token
router.post("/generate", async (req, res) => {
  try {
    const { name, uid, department } = req.body;

    if (!name || !uid || !department) {
      return res.status(400).json({
        success: false,
        message: "Please provide name, UID and department"
      });
    }

    const lastToken = await Token.findOne({ department })
      .sort({ tokenNumber: -1 });

    const tokenNumber = lastToken ? lastToken.tokenNumber + 1 : 1;

    const newToken = await Token.create({
      name,
      uid,
      department,
      tokenNumber
    });

    res.status(201).json({
      success: true,
      message: "Token generated successfully",
      token: newToken
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get all tokens
router.get("/", async (req, res) => {
  try {
    const tokens = await Token.find().sort({ createdAt: 1 });

    res.json({
      success: true,
      tokens
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Update token status
router.patch("/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    const allowedStatuses = [
      "waiting",
      "serving",
      "completed",
      "cancelled",
      "skipped"
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid token status"
      });
    }

    const token = await Token.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!token) {
      return res.status(404).json({
        success: false,
        message: "Token not found"
      });
    }

    res.json({
      success: true,
      token
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Cancel a token
router.delete("/:id", async (req, res) => {
  try {
    const token = await Token.findByIdAndUpdate(
      req.params.id,
      { status: "cancelled" },
      { new: true }
    );

    if (!token) {
      return res.status(404).json({
        success: false,
        message: "Token not found"
      });
    }

    res.json({
      success: true,
      message: "Token cancelled successfully",
      token
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
