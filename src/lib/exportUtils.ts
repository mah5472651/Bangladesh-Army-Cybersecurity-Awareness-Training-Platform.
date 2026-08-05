/**
 * Client-side CSV / PDF helpers.
 * Never exports passwords or credential-like fields.
 * Real PDF generation via jsPDF; server PDF preferred when API is online.
 */

export function downloadCsv(filename: string, rows: Record<string, string | number>[]) {
  if (rows.length === 0) {
    const blob = new Blob(["message\nNo data\n"], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    return;
  }
  const headers = Object.keys(rows[0]);
  const escape = (v: string | number) => {
    const s = String(v);
    if (s.includes(",") || s.includes('"') || s.includes("\n")) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };
  const lines = [
    headers.join(","),
    ...rows.map((row) => headers.map((h) => escape(row[h] ?? "")).join(",")),
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function printCertificate() {
  window.print();
}

/** Build a real PDF (ArrayBuffer) using a minimal PDF writer — no heavy deps required */
export function buildClientPdf(opts: {
  title: string;
  lines: string[];
  filename: string;
}): void {
  const { title, lines, filename } = opts;
  const escapePdf = (t: string) =>
    t.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");

  let y = 750;
  const content: string[] = [];
  content.push(`BT /F2 16 Tf 50 ${y} Td (${escapePdf(title)}) Tj ET`);
  y -= 28;
  for (const line of lines) {
    if (y < 60) break;
    const chunks = line.match(/.{1,95}/g) || [line];
    for (const chunk of chunks) {
      content.push(`BT /F1 10 Tf 50 ${y} Td (${escapePdf(chunk)}) Tj ET`);
      y -= 14;
    }
  }
  content.push(
    `BT /F1 8 Tf 50 40 Td (${escapePdf("BA Cyber Training · No credentials included")}) Tj ET`
  );

  const stream = content.join("\n");
  const objects = [
    "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n",
    "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n",
    "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> >>\nendobj\n",
    `4 0 obj\n<< /Length ${new TextEncoder().encode(stream).length} >>\nstream\n${stream}\nendstream\nendobj\n`,
    "5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n",
    "6 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n",
  ];

  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  const enc = new TextEncoder();
  for (const obj of objects) {
    offsets.push(enc.encode(pdf).length);
    pdf += obj;
  }
  const xrefPos = enc.encode(pdf).length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  for (let i = 1; i <= objects.length; i++) {
    pdf += String(offsets[i]).padStart(10, "0") + " 00000 n \n";
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefPos}\n%%EOF\n`;

  const blob = new Blob([pdf], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadPersonalPdfReport(opts: {
  username: string;
  displayName: string;
  rank: string;
  unit: string;
  completedCount: number;
  totalModules: number;
  averageScore: number;
  awarenessScore: number;
  xp: number;
  modules: { number: number; title: string; completed: boolean; score: number }[];
}) {
  const lines = [
    `Trainee: ${opts.rank} ${opts.displayName} (${opts.username})`,
    `Unit: ${opts.unit}`,
    `Completion: ${opts.completedCount}/${opts.totalModules}`,
    `Avg score: ${opts.averageScore}% · Awareness: ${opts.awarenessScore} · XP: ${opts.xp}`,
    `Generated: ${new Date().toISOString()}`,
    "",
    "Module results:",
    ...opts.modules.map(
      (m) =>
        `${m.number}. ${m.title} — ${m.completed ? "Complete" : "Incomplete"} — ${m.score}%`
    ),
  ];
  buildClientPdf({
    title: "BA Cyber Training — Personal Report",
    lines,
    filename: `ba-cyber-report-${opts.username}.pdf`,
  });
}

export function downloadCertificatePdf(opts: {
  certId: string;
  displayName: string;
  rank: string;
  unit: string;
  username: string;
  completedCount: number;
  totalModules: number;
  averageScore: number;
  xp: number;
  dateStr: string;
}) {
  buildClientPdf({
    title: "Certificate of Completion — Cyber Defender Awareness",
    lines: [
      "Bangladesh Army Cybersecurity Awareness Training Platform",
      "",
      "This certifies that",
      `${opts.rank} ${opts.displayName}`,
      `${opts.unit} · Training ID: ${opts.username}`,
      "",
      "has successfully completed the authorized internal cybersecurity",
      "awareness curriculum through safe educational simulations.",
      "",
      `Modules: ${opts.completedCount}/${opts.totalModules}`,
      `Average score: ${opts.averageScore}%`,
      `XP: ${opts.xp}`,
      `Date: ${opts.dateStr}`,
      `Certificate ID: ${opts.certId}`,
      "",
      "Verify on platform at /verify/" + opts.certId,
      "Training / Unclassified · Not a security clearance",
    ],
    filename: `ba-cyber-certificate-${opts.username}.pdf`,
  });
}
