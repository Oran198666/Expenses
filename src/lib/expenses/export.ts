// Builds CSV and PDF exports in the browser and starts the download (ADR-17).
// The PDF libraries load only when a PDF is requested.
import Papa from "papaparse";
import type { ExportRow } from "@/app/actions/reports";
import { addMoney } from "@/lib/expenses/reports";

const HEADERS = ["Date", "Category", "Description", "Amount", "Currency"];

/** Stops spreadsheet apps from running a cell as a formula. */
function safeCell(text: string): string {
  return /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
}

function download(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function exportFileName(scope: "all" | "filtered", ext: "csv" | "pdf", today: string) {
  return `expenses-${scope}-${today}.${ext}`;
}

export function downloadCsv(rows: ExportRow[], fileName: string) {
  const csv = Papa.unparse({
    fields: HEADERS,
    data: rows.map((r) => [
      safeCell(r.date),
      safeCell(r.category),
      safeCell(r.description),
      r.amount.toFixed(2),
      r.currency,
    ]),
  });
  // The BOM makes Excel read the file as UTF-8 (Hebrew and other text).
  download(new Blob(["﻿", csv], { type: "text/csv;charset=utf-8" }), fileName);
}

/** Totals per currency, never combined (sorted by currency code). */
export function totalsByCurrency(rows: ExportRow[]): { currency: string; total: number; count: number }[] {
  const map = new Map<string, { total: number; count: number }>();
  for (const r of rows) {
    const t = map.get(r.currency) ?? { total: 0, count: 0 };
    map.set(r.currency, { total: addMoney(t.total, r.amount), count: t.count + 1 });
  }
  return [...map]
    .map(([currency, t]) => ({ currency, ...t }))
    .sort((a, b) => a.currency.localeCompare(b.currency));
}

function money(amount: number, currency: string): string {
  // The built-in PDF font can't draw symbols such as ₪, so use the code.
  return `${currency} ${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export async function downloadPdf(
  rows: ExportRow[],
  fileName: string,
  scopeLine: string,
  today: string,
) {
  const [{ jsPDF }, { autoTable }] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const margin = 40;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("Expense Report", margin, 50);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Created: ${today}`, margin, 68);
  doc.text(`Includes: ${scopeLine} (${rows.length} expense${rows.length === 1 ? "" : "s"})`, margin, 82);

  autoTable(doc, {
    startY: 96,
    margin: { left: margin, right: margin, bottom: 50 },
    head: [HEADERS],
    body: rows.map((r) => [r.date, r.category, r.description, money(r.amount, r.currency), r.currency]),
    styles: { font: "helvetica", fontSize: 9, cellPadding: 4, overflow: "linebreak" },
    headStyles: { fillColor: [76, 28, 115], textColor: [255, 255, 255] },
    alternateRowStyles: { fillColor: [244, 240, 250] },
    columnStyles: {
      0: { cellWidth: 70 },
      1: { cellWidth: 90 },
      3: { halign: "right", cellWidth: 90 },
      4: { cellWidth: 55 },
    },
  });

  const lastY = (doc as unknown as { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY ?? 96;
  autoTable(doc, {
    startY: lastY + 24,
    margin: { left: margin, right: margin, bottom: 50 },
    head: [["Totals by currency", "Expenses", "Total"]],
    body: totalsByCurrency(rows).map((t) => [t.currency, String(t.count), money(t.total, t.currency)]),
    styles: { font: "helvetica", fontSize: 10, cellPadding: 4 },
    headStyles: { fillColor: [76, 28, 115], textColor: [255, 255, 255] },
    columnStyles: { 1: { halign: "right" }, 2: { halign: "right" } },
    tableWidth: 300,
    rowPageBreak: "avoid",
  });

  // Page numbers at the bottom of every page.
  const pages = doc.getNumberOfPages();
  const { width, height } = doc.internal.pageSize;
  doc.setFontSize(9);
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.text(`Page ${i} of ${pages}`, width - margin, height - 24, { align: "right" });
  }

  download(doc.output("blob"), fileName);
}
