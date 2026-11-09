
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

const tokenRoutes = require("./routes/tokenRoutes");

app.use("/api/tokens", tokenRoutes);

app.get("/", (req, res) => {
  res.send("QueueLess Backend is Running!");
});

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "QueueLess API is working"
  });
});

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected successfully!");

    app.listen(PORT, () => {
      console.log(`QueueLess server running on port ${PORT}`);
    });
  } catch (error) {
    console.log("MongoDB connection error:", error.message);
  }
}

startServer();
