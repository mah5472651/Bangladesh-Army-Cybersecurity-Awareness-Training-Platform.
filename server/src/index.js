/**
 * Bangladesh Army Cybersecurity Awareness Training Platform — API
 *
 * Authorized internal training only.
 * NEVER collects, stores, or transmits real user credentials from simulations.
 */
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { loginHandler, logoutHandler, requireAuth } from "./auth.js";
import {
  rejectCredentialPayload,
  clientIp,
  csrfProtection,
  sanitizeStrings,
  assertProductionSecrets,
} from "./security.js";
import { healthCheck, getPool } from "./db/pool.js";
import progressRouter from "./routes/progress.js";
import simEventsRouter from "./routes/simEvents.js";
import instructorRouter from "./routes/instructor.js";
import adminRouter from "./routes/admin.js";
import gamificationRouter from "./routes/gamification.js";
import reportsRouter from "./routes/reports.js";

assertProductionSecrets();

const PORT = Number(process.env.PORT || 4000);
const app = express();

app.set("trust proxy", 1);

app.use(
  helmet({
    contentSecurityPolicy: false, // CSP applied at Nginx for the SPA
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

const allowedOrigins = (process.env.CORS_ORIGINS || "http://localhost:5173,http://localhost:3000,http://localhost")
  .split(",")
  .map((s) => s.trim());

app.use(
  cors({
    origin(origin, cb) {
      if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== "production") {
        return cb(null, true);
      }
      return cb(new Error("Not allowed by CORS"));
    },
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization", "X-CSRF-Token"],
    exposedHeaders: ["X-CSRF-Token", "X-Certificate-Id", "Content-Disposition"],
  })
);

app.use(express.json({ limit: "100kb" }));
app.use(sanitizeStrings);
app.use(rejectCredentialPayload);
app.use(csrfProtection);

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 400,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests. Please try again later." },
});
app.use(globalLimiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many login attempts. Please wait and try again." },
});

app.use((req, _res, next) => {
  if (process.env.LOG_REQUESTS === "1") {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} ip=${clientIp(req)}`);
  }
  next();
});

app.get("/api/health", async (_req, res) => {
  const db = await healthCheck();
  res.json({
    status: "ok",
    mode: db.mode,
    database: db.ok ? "connected" : "memory-fallback",
    platform: "Bangladesh Army Cybersecurity Awareness Training Platform",
    policy: "Training-only. Never stores simulation credentials.",
  });
});

app.post("/api/auth/login", authLimiter, loginHandler);
app.post("/api/auth/logout", requireAuth, logoutHandler);
app.get("/api/auth/me", requireAuth, (req, res) => {
  res.json({ user: req.user });
});

app.use("/api/progress", progressRouter);
app.use("/api/sim-events", simEventsRouter);
app.use("/api/instructor", instructorRouter);
app.use("/api/admin", adminRouter);
app.use("/api/gamification", gamificationRouter);
app.use("/api/reports", reportsRouter);

// Explicitly block any offensive phishing-campaign style routes
app.all(["/api/phish", "/api/campaign", "/api/harvest", "/api/credentials"], (_req, res) => {
  res.status(403).json({
    error:
      "Offensive phishing and credential-harvesting functionality is prohibited on this training platform.",
  });
});

app.use((err, _req, res, _next) => {
  console.error("[api]", err.message);
  res.status(err.status || 500).json({ error: err.message || "Internal server error" });
});

app.listen(PORT, () => {
  const mode = getPool() ? "postgres" : "memory";
  console.log(`BA Cyber Training API listening on :${PORT} (store=${mode})`);
  console.log("Policy: authorized awareness training only — no real credential capture.");
});
