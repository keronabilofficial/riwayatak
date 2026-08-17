import { useEffect } from "react";

export default function ContentSeo({ title, description, type, url }: { title: string; description?: string | null; type: "Book" | "Person"; url: string }) {
  useEffect(() => {
    document.title = `${title} | روايتك بالعربية`;
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) { meta = document.createElement("meta"); meta.setAttribute("name", "description"); document.head.appendChild(meta); }
    meta.setAttribute("content", description || `اكتشف ${title} على منصة روايتك بالعربية.`);
    const id = "riwayatak-content-schema";
    document.getElementById(id)?.remove();
    const script = document.createElement("script");
    script.id = id;
    script.type = "application/ld+json";
    script.text = JSON.stringify({ "@context": "https://schema.org", "@type": type, name: title, description: description || undefined, url });
    document.head.appendChild(script);
    return () => { document.getElementById(id)?.remove(); };
  }, [title, description, type, url]);
  return null;
}
