const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const sequelize = require("./config/db");
const profileRoutes = require("./routes/profileRoutes");
const contactRoutes = require("./routes/contactRoutes");
const adminRoutes = require("./routes/adminRoutes");
const adminAuthRoutes = require("./routes/AdminUserRoutes");
const cookieParser = require("cookie-parser");

const app = express();
// __dirname fix
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or server-to-server calls)
      if (!origin) return callback(null, true);

      const allowedDomains = [
        "localhost",
        "127.0.0.1",
        "indolankamatrimony.com",
        "www.indolankamatrimony.com",
        "bitesngrill.com",
        "amigowebster.in",
      ];

      const isAllowed =
        origin.endsWith(".vercel.app") ||
        origin.includes("indolankamatrimony.com") ||
        allowedDomains.some((d) => origin.includes(d));

      if (isAllowed) {
        return callback(null, true);
      }
      return callback(null, true); // Fallback: allow to prevent 500 crashes
    },
    methods: ["POST", "GET", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

// ✅ Fix: Strip cPanel subpath prefix (e.g. /indolankamatrimony_working) if forwarded by cPanel reverse proxy
app.use((req, res, next) => {
  const apiIndex = req.url.indexOf("/api/");
  const uploadsIndex = req.url.indexOf("/uploads/");
  if (apiIndex > 0) {
    req.url = req.url.substring(apiIndex);
  } else if (uploadsIndex > 0) {
    req.url = req.url.substring(uploadsIndex);
  } else if (req.url.startsWith("/indolankamatrimony_working")) {
    req.url = req.url.replace(/^\/indolankamatrimony_working/, "") || "/";
  }
  next();
});

// static folder -> frontend access for uploaded images
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/indolankamatrimony_working/uploads", express.static(path.join(__dirname, "uploads")));

(async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ MySQL connected successfully!");
    await sequelize.sync({ alter: true });
    console.log("✅ Tables synced successfully!");
  } catch (error) {
    console.error("❌ DB Errors:", error);
  }
})();

// Health check endpoint
app.get("/", (req, res) => res.json({ status: "ok", message: "Indolanka Backend Running" }));
app.get("/api", (req, res) => res.json({ status: "ok", message: "Indolanka API Running" }));
app.get("/indolankamatrimony_working", (req, res) => res.json({ status: "ok", message: "Indolanka Backend Running" }));
app.get("/indolankamatrimony_working/api", (req, res) => res.json({ status: "ok", message: "Indolanka API Running" }));

app.use("/api/profile", profileRoutes);
app.use("/indolankamatrimony_working/api/profile", profileRoutes);

app.use("/api/contact", contactRoutes);
app.use("/indolankamatrimony_working/api/contact", contactRoutes);

app.use("/api/admin", adminRoutes); // Base path /api/admin
app.use("/indolankamatrimony_working/api/admin", adminRoutes);

app.use("/api/adminAuth", adminAuthRoutes);
app.use("/indolankamatrimony_working/api/adminAuth", adminAuthRoutes);

// only Cpanel hosting purpose using steps

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server Connected ${PORT}`);
});
