import "dotenv/config";
import express from "express";
import cors from "cors";
import { initDb } from "./db/index.js";

import authRoutes from "./routes/auth.routes.js";
import contentRoutes from "./routes/content.routes.js";
import categoriesRoutes from "./routes/categories.routes.js";
import catalogRoutes from "./routes/catalog.routes.js";
import productsRoutes from "./routes/products.routes.js";

const app = express();

const allowedOrigins = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

app.disable("x-powered-by");

app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  next();
});

app.use(
  cors({
    origin(origin, cb) {
      if (
        !origin ||
        process.env.NODE_ENV !== "production" ||
        allowedOrigins.includes(origin)
      ) {
        return cb(null, true);
      }
      cb(new Error("Bu origin uchun CORS ruxsati yo‘q"));
    },
  }),
);

app.use(express.json({ limit: "1mb" }));

const loginAttempts = new Map();

app.use("/api/admin/login", (req, res, next) => {
  if (req.method !== "POST") return next();

  const key = req.ip || "unknown";
  const now = Date.now();
  const windowMs = 15 * 60 * 1000;
  const recent = (loginAttempts.get(key) || []).filter(
    (t) => now - t < windowMs,
  );

  if (recent.length >= 10) {
    return res.status(429).json({
      error: "Juda ko‘p urinish. 15 daqiqadan keyin qayta urinib ko‘ring.",
    });
  }

  recent.push(now);
  loginAttempts.set(key, recent);
  next();
});

app.use("/api/admin", authRoutes);
app.use("/api/content", contentRoutes);
app.use("/api/categories", categoriesRoutes);
app.use("/api/catalog", catalogRoutes);
app.use("/api/products", productsRoutes);

app.get("/api/health", (req, res) => res.json({ ok: true }));

app.use((err, req, res, next) => {
  console.error(`[${req.method} ${req.path}] xato:`, err);
  res.status(500).json({
    error: err.message || "Serverda kutilmagan xato yuz berdi",
  });
});

const port = process.env.PORT || 4000;

console.log(
  "Baza manzili:",
  process.env.TURSO_DATABASE_URL
    ? `Turso (${process.env.TURSO_DATABASE_URL})`
    : "lokal fayl (data.sqlite) — TURSO_DATABASE_URL bo‘sh!",
);

initDb()
  .then(() => {
    app.listen(port, () =>
      console.log(`Snug House backend ${port}-portda ishga tushdi`),
    );
  })
  .catch((err) => {
    console.error("Bazani ishga tushirishda xato:", err);
    process.exit(1);
  });
