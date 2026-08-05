/**
 * Minimal PDF generator (no external deps) for training reports & certificates.
 * Produces valid PDF 1.4 with Helvetica text.
 */

function escapePdf(text) {
  return String(text ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

/**
 * @param {{ title: string, lines: string[], table?: { headers: string[], rows: string[][] } }} opts
 * @returns {Buffer}
 */
export function buildSimplePdf({ title, subtitle = "", lines = [], table = null, footer = "" }) {
  const pageWidth = 612;
  const pageHeight = 792;
  const content = [];
  let y = pageHeight - 72;

  const addText = (str, x, size = 11, font = "F1") => {
    content.push(`BT /${font} ${size} Tf ${x} ${y} Td (${escapePdf(str)}) Tj ET`);
    y -= size + 6;
  };

  content.push("BT /F2 18 Tf 50 " + y + " Td (" + escapePdf(title) + ") Tj ET");
  y -= 28;
  if (subtitle) {
    content.push("BT /F1 11 Tf 50 " + y + " Td (" + escapePdf(subtitle) + ") Tj ET");
    y -= 20;
  }

  for (const line of lines) {
    if (y < 80) break;
    // wrap long lines roughly
    const max = 90;
    let remaining = line;
    while (remaining.length > 0 && y >= 80) {
      const chunk = remaining.slice(0, max);
      remaining = remaining.slice(max);
      addText(chunk, 50, 10);
    }
  }

  if (table && table.headers?.length && y > 120) {
    y -= 10;
    addText(table.headers.join("  |  "), 50, 9, "F2");
    y -= 4;
    for (const row of table.rows) {
      if (y < 70) break;
      addText(row.join("  |  "), 50, 9);
    }
  }

  if (footer) {
    y = 48;
    content.push(`BT /F1 8 Tf 50 ${y} Td (${escapePdf(footer)}) Tj ET`);
  }

  const stream = content.join("\n");
  const objects = [];

  objects.push("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n");
  objects.push("2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n");
  objects.push(
    "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> >>\nendobj\n"
  );
  objects.push(
    `4 0 obj\n<< /Length ${Buffer.byteLength(stream, "utf8")} >>\nstream\n${stream}\nendstream\nendobj\n`
  );
  objects.push("5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n");
  objects.push("6 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n");

  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  for (const obj of objects) {
    offsets.push(Buffer.byteLength(pdf, "utf8"));
    pdf += obj;
  }
  const xrefPos = Buffer.byteLength(pdf, "utf8");
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  for (let i = 1; i <= objects.length; i++) {
    pdf += String(offsets[i]).padStart(10, "0") + " 00000 n \n";
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefPos}\n%%EOF\n`;
  return Buffer.from(pdf, "utf8");
}

export function cohortReportPdf(analytics) {
  const lines = [
    `Generated: ${new Date().toISOString()}`,
    `Total trainees: ${analytics.summary.totalTrainees}`,
    `Avg completion: ${analytics.summary.avgCompletion}%`,
    `Avg awareness: ${analytics.summary.avgAwareness}`,
    `Sim clicks (count): ${analytics.summary.totalSimClicks}`,
    `Form attempts (count): ${analytics.summary.totalFormAttempts}`,
    "",
    "Department summary:",
    ...analytics.departments.map(
      (d) =>
        `${d.department}: ${d.trainees} trainees, ${d.completionRate}% complete, risk ${d.riskLevel}`
    ),
  ];

  const table = {
    headers: ["User", "Unit", "Mods", "Score", "Aware"],
    rows: analytics.trainees.slice(0, 40).map((t) => [
      t.username.slice(0, 12),
      (t.unit || "").slice(0, 16),
      `${t.completedModules}/${t.totalModules}`,
      `${t.averageScore}%`,
      String(t.awarenessScore),
    ]),
  };

  return buildSimplePdf({
    title: "BA Cyber Training — Cohort Report",
    subtitle: "Authorized awareness training · No credentials included",
    lines,
    table,
    footer:
      "Bangladesh Army Cybersecurity Awareness Training Platform · Training/Unclassified · Counts and scores only",
  });
}

export function personalReportPdf(user, progressRows, summary) {
  const lines = [
    `Trainee: ${user.rank || ""} ${user.displayName || user.username}`,
    `Username: ${user.username}`,
    `Unit: ${user.unit || "—"}`,
    `Department: ${user.department || "—"}`,
    `Modules completed: ${summary.completedCount}/${summary.totalModules}`,
    `Average score: ${summary.averageScore}%`,
    `Awareness: ${summary.awarenessScore}`,
    `XP: ${summary.xp}`,
    "",
    "Module results:",
  ];

  const table = {
    headers: ["Module", "Done", "Score"],
    rows: progressRows.map((p) => [
      (p.moduleId || p.title || "").slice(0, 22),
      p.completed ? "Yes" : "No",
      `${p.score || 0}%`,
    ]),
  };

  return buildSimplePdf({
    title: "BA Cyber Training — Personal Report",
    subtitle: `Generated ${new Date().toISOString()}`,
    lines,
    table,
    footer: "No passwords or credential-like fields are included in this report.",
  });
}

export function certificatePdf({
  certId,
  displayName,
  rank,
  unit,
  username,
  completedCount,
  averageScore,
  xp,
  dateStr,
}) {
  return buildSimplePdf({
    title: "Certificate of Completion",
    subtitle: "Bangladesh Army — Cybersecurity Awareness Training",
    lines: [
      "This certifies that",
      "",
      `${rank} ${displayName}`,
      `${unit} · Training ID: ${username}`,
      "",
      "has successfully completed the authorized internal cybersecurity",
      "awareness curriculum through safe educational simulations that",
      "never collect real credentials.",
      "",
      `Modules: ${completedCount}/8`,
      `Average score: ${averageScore}%`,
      `XP: ${xp}`,
      `Date: ${dateStr}`,
      `Certificate ID: ${certId}`,
      "",
      "Verify at /verify/:certId on the training platform.",
    ],
    footer: "Training / Unclassified · Not a security clearance · Authorized training only",
  });
}
