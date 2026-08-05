import { Navigate } from "react-router-dom";
import { FileSpreadsheet, FileText, Download, BarChart3 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useProgress } from "../context/ProgressContext";
import { TRAINING_MODULES } from "../data/modules";
import {
  SAMPLE_TRAINEES,
  DEPARTMENT_PROGRESS,
  AWARENESS_TREND,
} from "../data/sampleAnalytics";
import { downloadCsv } from "../lib/exportUtils";
import GlassCard from "../components/GlassCard";
import "./Dashboard.css";

export default function Reports() {
  const { user } = useAuth();
  const { progress, completedCount, averageScore, overallPercent, totalXp, awarenessScore } =
    useProgress();

  if (!user) return <Navigate to="/login" replace />;

  const canExportCohort = user.role === "instructor" || user.role === "admin";

  const exportPersonalCsv = () => {
    const rows = TRAINING_MODULES.map((m) => {
      const p = progress.find((x) => x.moduleId === m.id);
      return {
        module_number: m.number,
        module_id: m.id,
        title: m.title,
        completed: p?.completed ? "yes" : "no",
        score: p?.score ?? 0,
        attempts: p?.attempts ?? 0,
        completed_at: p?.completedAt ?? "",
      };
    });
    downloadCsv(`ba-cyber-progress-${user.username}.csv`, rows);
  };

  const exportPersonalSummary = () => {
    downloadCsv(`ba-cyber-summary-${user.username}.csv`, [
      {
        username: user.username,
        display_name: user.displayName,
        unit: user.unit,
        modules_completed: completedCount,
        total_modules: TRAINING_MODULES.length,
        overall_percent: overallPercent,
        average_score: averageScore,
        awareness_score: awarenessScore,
        xp: totalXp,
        export_note: "No passwords or credentials included",
      },
    ]);
  };

  const exportDepartmentCsv = () => {
    downloadCsv(
      "ba-cyber-department-summary.csv",
      DEPARTMENT_PROGRESS.map((d) => ({
        department: d.department,
        trainees: d.trainees,
        completion_rate: d.completionRate,
        avg_score: d.avgScore,
        risk_level: d.riskLevel,
      }))
    );
  };

  const exportCohortCsv = () => {
    downloadCsv(
      "ba-cyber-cohort-completion.csv",
      SAMPLE_TRAINEES.map((t) => ({
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
      }))
    );
  };

  const exportTrendCsv = () => {
    downloadCsv(
      "ba-cyber-awareness-trend.csv",
      AWARENESS_TREND.map((t) => ({ month: t.month, awareness_score: t.score }))
    );
  };

  const openPrintablePdfReport = () => {
    const w = window.open("", "_blank");
    if (!w) return;
    const moduleRows = TRAINING_MODULES.map((m) => {
      const p = progress.find((x) => x.moduleId === m.id);
      return `<tr><td>${m.number}</td><td>${m.title}</td><td>${p?.completed ? "Yes" : "No"}</td><td>${p?.score ?? 0}%</td></tr>`;
    }).join("");
    w.document.write(`<!DOCTYPE html><html><head><title>Training Report</title>
      <style>
        body{font-family:Segoe UI,system-ui,sans-serif;padding:32px;color:#111}
        h1{color:#1a2e1a} table{border-collapse:collapse;width:100%;margin-top:16px}
        th,td{border:1px solid #ccc;padding:8px;text-align:left} th{background:#e8ebe3}
        .note{margin-top:24px;font-size:12px;color:#555}
      </style></head><body>
      <h1>Bangladesh Army — Cybersecurity Awareness Report</h1>
      <p><strong>Trainee:</strong> ${user.rank} ${user.displayName} (${user.username}) · ${user.unit}</p>
      <p><strong>Completion:</strong> ${completedCount}/${TRAINING_MODULES.length} (${overallPercent}%) ·
         <strong>Avg score:</strong> ${averageScore}% · <strong>Awareness:</strong> ${awarenessScore} ·
         <strong>XP:</strong> ${totalXp}</p>
      <table><thead><tr><th>#</th><th>Module</th><th>Completed</th><th>Score</th></tr></thead>
      <tbody>${moduleRows}</tbody></table>
      <p class="note">Authorized training platform report. No real credentials are collected, stored, or exported.
      Generated ${new Date().toISOString()}. Use browser Print → Save as PDF.</p>
      </body></html>`);
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 300);
  };

  return (
    <div className="dashboard">
      <div className="container">
        <header className="dash-header">
          <div>
            <div className="section-eyebrow">
              <BarChart3 size={14} /> Analytics Export
            </div>
            <h1>Reports</h1>
            <p>
              Generate CSV exports and printable PDF summaries. Exports never include passwords or
              credential-like fields — counts and scores only.
            </p>
          </div>
        </header>

        <div className="grid-2">
          <GlassCard className="chart-card">
            <h3>
              <FileSpreadsheet size={18} style={{ verticalAlign: "middle", marginRight: 6 }} />
              Personal CSV
            </h3>
            <p style={{ color: "var(--olive-300)", margin: "0.75rem 0 1rem" }}>
              Module-by-module completion and scores for your training account.
            </p>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              <button type="button" className="btn btn-primary btn-sm" onClick={exportPersonalCsv}>
                <Download size={14} /> Module Progress CSV
              </button>
              <button type="button" className="btn btn-secondary btn-sm" onClick={exportPersonalSummary}>
                <Download size={14} /> Summary CSV
              </button>
            </div>
          </GlassCard>

          <GlassCard className="chart-card">
            <h3>
              <FileText size={18} style={{ verticalAlign: "middle", marginRight: 6 }} />
              PDF Report
            </h3>
            <p style={{ color: "var(--olive-300)", margin: "0.75rem 0 1rem" }}>
              Opens a print-ready HTML report. Choose “Save as PDF” in the print dialog.
            </p>
            <button type="button" className="btn btn-primary btn-sm" onClick={openPrintablePdfReport}>
              <Download size={14} /> Generate PDF Report
            </button>
          </GlassCard>

          {canExportCohort && (
            <>
              <GlassCard className="chart-card">
                <h3>Department Summaries</h3>
                <p style={{ color: "var(--olive-300)", margin: "0.75rem 0 1rem" }}>
                  Instructor/admin export of unit completion and risk levels.
                </p>
                <button type="button" className="btn btn-secondary btn-sm" onClick={exportDepartmentCsv}>
                  <Download size={14} /> Department CSV
                </button>
              </GlassCard>

              <GlassCard className="chart-card">
                <h3>Cohort & Trends</h3>
                <p style={{ color: "var(--olive-300)", margin: "0.75rem 0 1rem" }}>
                  Sample cohort completion statistics and awareness trend series.
                </p>
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={exportCohortCsv}>
                    <Download size={14} /> Cohort CSV
                  </button>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={exportTrendCsv}>
                    <Download size={14} /> Trend CSV
                  </button>
                </div>
              </GlassCard>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
