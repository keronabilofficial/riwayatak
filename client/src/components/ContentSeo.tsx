import { useEffect } from "react";

type ContentSeoProps = {
  title: string;
  description?: string | null;
  type: "Book" | "Person";
  url: string;
  image?: string | null;
  authorName?: string | null;
  keywords?: string[];
};

function upsertMeta(selector: string, attribute: "name" | "property", key: string, content: string) {
  let meta = document.querySelector<HTMLMetaElement>(selector);
  if (!meta) {
    meta = document.createElement("meta");
    meta.setAttribute(attribute, key);
    document.head.appendChild(meta);
  }
  meta.setAttribute("content", content);
}

export default function ContentSeo({ title, description, type, url, image, authorName, keywords }: ContentSeoProps) {
  useEffect(() => {
    const resolvedDescription = description || `اكتشف ${title} على منصة روايتك بالعربية.`;
    document.title = `${title} | روايتك بالعربية`;
    upsertMeta('meta[name="description"]', "name", "description", resolvedDescription);
    upsertMeta('meta[property="og:title"]', "property", "og:title", title);
    upsertMeta('meta[property="og:description"]', "property", "og:description", resolvedDescription);
    upsertMeta('meta[property="og:type"]', "property", "og:type", type === "Book" ? "book" : "profile");
    upsertMeta('meta[property="og:url"]', "property", "og:url", url);
    if (image) upsertMeta('meta[property="og:image"]', "property", "og:image", image);
    upsertMeta('meta[name="twitter:card"]', "name", "twitter:card", image ? "summary_large_image" : "summary");
    upsertMeta('meta[name="twitter:title"]', "name", "twitter:title", title);
    upsertMeta('meta[name="twitter:description"]', "name", "twitter:description", resolvedDescription);
    if (keywords?.length) upsertMeta('meta[name="keywords"]', "name", "keywords", keywords.join(", "));

    const canonicalId = "riwayatak-canonical";
    document.getElementById(canonicalId)?.remove();
    const canonical = document.createElement("link");
    canonical.id = canonicalId;
    canonical.rel = "canonical";
    canonical.href = url;
    document.head.appendChild(canonical);

    const schemaId = "riwayatak-content-schema";
    document.getElementById(schemaId)?.remove();
    const schema = document.createElement("script");
    schema.id = schemaId;
    schema.type = "application/ld+json";
    schema.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": type,
      name: title,
      description: resolvedDescription,
      url,
      image: image || undefined,
      inLanguage: "ar",
      author: authorName ? { "@type": "Person", name: authorName } : undefined,
      keywords: keywords?.join(", ") || undefined,
    });
    document.head.appendChild(schema);
    return () => {
      document.getElementById(canonicalId)?.remove();
      document.getElementById(schemaId)?.remove();
    };
  }, [title, description, type, url, image, authorName, keywords]);
  return null;
}
