import { Router } from "express";
import { requireAuth, requireRole } from "../auth.js";
import { getPool, query } from "../db/pool.js";
import { memGetProgress, memXp, memory, memSaveCertificate, memGetCertificate } from "../db/memoryStore.js";
import { personalReportPdf, certificatePdf } from "../lib/pdfReport.js";
import { MODULES, toCsv } from "../lib/cohort.js";
import { randomUUID } from "crypto";

const router = Router();

const MODULE_TITLES = {
  "email-phishing": "Email Phishing",
  "fake-login": "Fake Login",
  "qr-phishing": "QR Phishing",
  "sms-phishing": "SMS Phishing",
  "voice-phishing": "Voice Phishing",
  "usb-security": "USB Security",
  "password-security": "Password Security",
  "social-engineering": "Social Engineering",
};

async function getUserProgress(userId) {
  if (getPool()) {
    const { rows } = await query(
      `SELECT module_id AS "moduleId", completed, score, attempts,
              completed_at AS "completedAt"
       FROM module_progress WHERE user_id = $1`,
      [userId]
    );
    return rows;
  }
  return memGetProgress(userId);
}

function summarize(progress) {
  const done = progress.filter((p) => p.completed);
  const averageScore =
    done.length > 0
      ? Math.round(done.reduce((s, p) => s + p.score, 0) / done.length)
      : 0;
  const completedCount = done.length;
  const totalModules = 8;
  const overallPercent = Math.round((completedCount / totalModules) * 100);
  const xp = done.reduce((s, p) => s + 100 + Math.round(p.score * 0.5), 0);
  const awarenessScore = Math.round(overallPercent * 0.5 + averageScore * 0.5);
  return { completedCount, totalModules, overallPercent, averageScore, xp, awarenessScore };
}

router.get("/personal/csv", requireAuth, async (req, res) => {
  try {
    const progress = await getUserProgress(req.user.id);
    const byId = Object.fromEntries(progress.map((p) => [p.moduleId, p]));
    const rows = MODULES.map((id, i) => {
      const p = byId[id];
      return {
        module_number: i + 1,
        module_id: id,
        title: MODULE_TITLES[id],
        completed: p?.completed ? "yes" : "no",
        score: p?.score ?? 0,
        attempts: p?.attempts ?? 0,
        completed_at: p?.completedAt ?? "",
      };
    });
    const csv = toCsv(rows);
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="ba-cyber-progress-${req.user.username}.csv"`
    );
    return res.send(csv);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

router.get("/personal/pdf", requireAuth, async (req, res) => {
  try {
    const progress = await getUserProgress(req.user.id);
    const byId = Object.fromEntries(progress.map((p) => [p.moduleId, p]));
    const rows = MODULES.map((id) => ({
      moduleId: MODULE_TITLES[id] || id,
      completed: Boolean(byId[id]?.completed),
      score: byId[id]?.score ?? 0,
    }));
    const summary = summarize(progress);
    if (!getPool()) summary.xp = memXp(req.user.id);

    const pdf = personalReportPdf(req.user, rows, summary);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="ba-cyber-report-${req.user.username}.pdf"`
    );
    return res.send(pdf);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

/** Issue / download certificate PDF when curriculum complete */
router.post("/certificate", requireAuth, async (req, res) => {
  try {
    const progress = await getUserProgress(req.user.id);
    const summary = summarize(progress);
    if (summary.completedCount < 8) {
      return res.status(400).json({
        error: `Complete all 8 modules to receive a certificate (${summary.completedCount}/8 done).`,
      });
    }

    const certId = `BA-CAT-${req.user.username.toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
    const dateStr = new Date().toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    const record = {
      certId,
      userId: req.user.id,
      username: req.user.username,
      displayName: req.user.displayName,
      rank: req.user.rank,
      unit: req.user.unit,
      completedCount: summary.completedCount,
      averageScore: summary.averageScore,
      xp: summary.xp || memXp(req.user.id),
      issuedAt: new Date().toISOString(),
      dateStr,
    };

    if (getPool()) {
      await query(
        `INSERT INTO certificates (cert_id, user_id, username, display_name, rank, unit, completed_count, average_score, xp)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (cert_id) DO NOTHING`,
        [
          certId,
          req.user.id,
          record.username,
          record.displayName,
          record.rank,
          record.unit,
          record.completedCount,
          record.averageScore,
          record.xp,
        ]
      ).catch(async () => {
        // Table may not exist yet on old deploys — still return PDF
      });
    } else {
      memSaveCertificate(record);
    }

    const pdf = certificatePdf(record);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="ba-cyber-certificate-${req.user.username}.pdf"`
    );
    res.setHeader("X-Certificate-Id", certId);
    return res.send(pdf);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

/** Public certificate verification (no auth — ID only, no secrets) */
router.get("/verify/:certId", async (req, res) => {
  try {
    const { certId } = req.params;
    if (!certId || certId.length < 8) {
      return res.status(400).json({ valid: false, error: "Invalid certificate ID." });
    }

    if (getPool()) {
      const { rows } = await query(
        `SELECT cert_id AS "certId", username, display_name AS "displayName", rank, unit,
                completed_count AS "completedCount", average_score AS "averageScore",
                xp, issued_at AS "issuedAt"
         FROM certificates WHERE cert_id = $1`,
        [certId]
      ).catch(() => ({ rows: [] }));
      if (rows[0]) {
        return res.json({
          valid: true,
          certificate: rows[0],
          note: "Training certificate verified. Not a security clearance.",
        });
      }
    } else {
      const rec = memGetCertificate(certId);
      if (rec) {
        return res.json({
          valid: true,
          certificate: {
            certId: rec.certId,
            username: rec.username,
            displayName: rec.displayName,
            rank: rec.rank,
            unit: rec.unit,
            completedCount: rec.completedCount,
            averageScore: rec.averageScore,
            xp: rec.xp,
            issuedAt: rec.issuedAt,
          },
          note: "Training certificate verified. Not a security clearance.",
        });
      }
    }

    return res.status(404).json({ valid: false, error: "Certificate not found." });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

/** Instructor cohort exports also mounted under /reports for convenience */
router.get("/cohort/csv", requireAuth, requireRole("instructor", "admin"), async (req, res) => {
  // Delegate shape: redirect-style by reusing instructor path logic via import would cycle;
  // clients should use /api/instructor/export/csv — keep thin alias
  return res.redirect(307, `/api/instructor/export/csv?type=${req.query.type || "cohort"}`);
});

export default router;
