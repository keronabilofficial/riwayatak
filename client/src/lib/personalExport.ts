export type ExportNote = { title: string; rating?: number | null; note: string };
export type ExportQuote = { novelTitle: string; chapterTitle: string; selectedText: string };

export function buildPersonalExportText(notes: ExportNote[], quotes: ExportQuote[]) {
  const sections = ["روايتك بالعربية — مقتنياتي الشخصية", "=".repeat(36)];
  if (notes.length) {
    sections.push("\nملاحظاتي وتقييماتي\n------------------");
    notes.forEach(item => {
      sections.push(`\n${item.title}${item.rating ? ` — تقييمي: ${item.rating}/5` : ""}\n${item.note}`);
    });
  }
  if (quotes.length) {
    sections.push("\nاقتباساتي المحفوظة\n-------------------");
    quotes.forEach(item => sections.push(`\n«${item.selectedText}»\n${item.novelTitle} — ${item.chapterTitle}`));
  }
  if (!notes.length && !quotes.length) sections.push("\nلا توجد ملاحظات أو اقتباسات محفوظة بعد.");
  return `${sections.join("\n").trim()}\n`;
}

export function downloadTextFile(content: string, filename = "مقتنياتي-الشخصية.txt") {
  const blob = new Blob(["\ufeff", content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function openPersonalExportPrint(title: string, content: string) {
  const printWindow = window.open("", "_blank");
  if (!printWindow) return false;
  const escaped = content.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  printWindow.document.write(`<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>${title}</title><style>body{font-family:Arial,sans-serif;direction:rtl;line-height:2;max-width:760px;margin:40px auto;padding:0 24px;color:#1d2940}h1{font-size:24px;border-bottom:2px solid #af7c42;padding-bottom:12px}pre{white-space:pre-wrap;font:inherit}</style></head><body><h1>${title}</h1><pre>${escaped}</pre><script>window.onload=function(){window.print()}</script></body></html>`);
  printWindow.document.close();
  return true;
}
