import { Router } from "express";
import { requireAuth, requireRole } from "../auth.js";
import { loadTrainees, buildCohortAnalytics, toCsv } from "../lib/cohort.js";
import { cohortReportPdf } from "../lib/pdfReport.js";

const router = Router();

router.get("/stats", requireAuth, requireRole("instructor", "admin"), async (_req, res) => {
  try {
    const trainees = await loadTrainees();
    const analytics = buildCohortAnalytics(trainees);
    // Never silently inject fake sample data — empty cohort returns empty arrays + empty flag
    return res.json(analytics);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

router.get("/export/csv", requireAuth, requireRole("instructor", "admin"), async (_req, res) => {
  try {
    const trainees = await loadTrainees();
    const analytics = buildCohortAnalytics(trainees);
    const type = (_req.query.type || "cohort").toString();

    let rows;
    let filename;
    if (type === "department") {
      rows = analytics.departments.map((d) => ({
        department: d.department,
        trainees: d.trainees,
        completion_rate: d.completionRate,
        avg_score: d.avgScore,
        risk_level: d.riskLevel,
      }));
      filename = "ba-cyber-department-summary.csv";
    } else if (type === "trend") {
      rows = analytics.awarenessTrend.map((t) => ({
        month: t.month,
        awareness_score: t.score,
      }));
      filename = "ba-cyber-awareness-trend.csv";
    } else {
      rows = analytics.trainees.map((t) => ({
        username: t.username,
        display_name: t.displayName,
        rank: t.rank,
        unit: t.unit,
        department: t.department,
        modules_completed: t.completedModules,
        average_score: t.averageScore,
        awareness_score: t.awarenessScore,
        sim_clicks: t.simClicks,
        form_attempts: t.formAttempts,
        xp: t.xp,
      }));
      filename = "ba-cyber-cohort-completion.csv";
    }

    const csv = toCsv(rows);
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    return res.send(csv);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

router.get("/export/pdf", requireAuth, requireRole("instructor", "admin"), async (_req, res) => {
  try {
    const trainees = await loadTrainees();
    const analytics = buildCohortAnalytics(trainees);
    const pdf = cohortReportPdf(analytics);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="ba-cyber-cohort-report.pdf"`
    );
    return res.send(pdf);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

export default router;
