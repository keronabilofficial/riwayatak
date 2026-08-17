const ALLOWED_TAGS = new Set(["strong", "b", "em", "i", "u", "p", "br", "ul", "ol", "li", "h3", "blockquote", "a"]);

export function sanitizeLegalHtml(input: string): string {
  const source = input.replace(/\r\n?/g, "\n");
  return source.replace(/<\/?([a-zA-Z0-9]+)([^>]*)>/g, (full, rawTag: string, rawAttrs: string) => {
    const tag = rawTag.toLowerCase();
    if (!ALLOWED_TAGS.has(tag)) return "";
    if (full.startsWith("</")) return `</${tag}>`;
    if (tag === "br") return "<br />";
    if (tag !== "a") return `<${tag}>`;
    const hrefMatch = rawAttrs.match(/href\s*=\s*["']([^"']+)["']/i);
    const href = hrefMatch?.[1]?.trim() ?? "";
    if (!/^(https?:|mailto:)/i.test(href)) return "<a>";
    const safeHref = href.replace(/[<>"']/g, "");
    return `<a href="${safeHref}" target="_blank" rel="noopener noreferrer">`;
  }).replace(/\n/g, "<br />");
}
