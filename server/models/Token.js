
const mongoose = require("mongoose");

const tokenSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    uid: {
      type: String,
      required: true,
      trim: true
    },
    department: {
      type: String,
      required: true
    },
    tokenNumber: {
      type: Number,
      required: true
    },
    status: {
      type: String,
      enum: ["waiting", "serving", "completed", "cancelled", "skipped"],
      default: "waiting"
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Token", tokenSchema);
