require("dotenv").config();
const dns = require("dns");

// Set reliable DNS servers (Google & Cloudflare IPv6 + IPv4) to prevent SRV ETIMEOUT/ECONNREFUSED on Windows
try {
  dns.setServers([
    "2001:4860:4860::8888", // Google Public IPv6
    "2001:4860:4860::8844",
    "2606:4700:4700::1111", // Cloudflare IPv6
    "8.8.8.8",              // Google Public IPv4
    "1.1.1.1",              // Cloudflare IPv4
  ]);
  dns.setDefaultResultOrder("ipv4first");
} catch (e) {
  console.warn("Could not configure custom DNS servers:", e.message);
}

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const foodRoutes = require("./Routes/foodRoutes");
const authRoutes = require("./Routes/authRoutes");
const orderRoutes = require("./Routes/orderRoutes");
const loyaltyRoutes = require("./Routes/loyaltyRoutes");
const reservationRoutes = require("./Routes/reservationRoutes");
const groupOrderRoutes = require("./Routes/groupOrderRoutes");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

app.use("/api/foods", foodRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/loyalty", loyaltyRoutes);
app.use("/api/reservations", reservationRoutes);
app.use("/api/group-orders", groupOrderRoutes);

const path = require("path");
const fs = require("fs");

const frontendDist = path.join(__dirname, "../frontend/dist");
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get(/^(?!\/api|\/health).*/, (req, res) => {
    res.sendFile(path.join(frontendDist, "index.html"));
  });
} else {
  app.get("/", (req, res) => {
    res.send("Foodie Backend is Running!");
  });
}

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Foodie backend running on http://localhost:${PORT}`);
});

let isConnecting = false;
let lastError = null;

app.get("/health", (req, res) => {
  res.json({
    readyState: mongoose.connection.readyState,
    status: ["disconnected", "connected", "connecting", "disconnecting"][mongoose.connection.readyState],
    lastError: lastError ? lastError.message : null,
  });
});

const DEFAULT_MONGO_URI =
  "mongodb+srv://navishraj6_db_user:navi2006@cluster0.ydui5cc.mongodb.net/foodie?retryWrites=true&w=majority&appName=Cluster0";

let rawUri = (process.env.MONGO_URI || "").trim();
// Strip wrapping quotes if pasted with quotes in Vercel dashboard
if (
  (rawUri.startsWith('"') && rawUri.endsWith('"')) ||
  (rawUri.startsWith("'") && rawUri.endsWith("'"))
) {
  rawUri = rawUri.slice(1, -1).trim();
}

const mongoUri =
  rawUri && (rawUri.startsWith("mongodb://") || rawUri.startsWith("mongodb+srv://"))
    ? rawUri
    : DEFAULT_MONGO_URI;

async function connectDB() {
  if (isConnecting || mongoose.connection.readyState === 1) return;
  isConnecting = true;
  try {
    await mongoose.disconnect().catch(() => {});
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 25000,
    });
    console.log("MongoDB connected successfully!");
    lastError = null;
  } catch (error) {
    lastError = error;
    console.error("MongoDB connection failed:", error.message);
    setTimeout(connectDB, 3000);
  } finally {
    isConnecting = false;
  }
}

mongoose.connection.on("disconnected", () => {
  console.log("MongoDB disconnected. Reconnecting...");
  setTimeout(connectDB, 2000);
});

connectDB();