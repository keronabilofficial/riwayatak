import { trpc } from "@/lib/trpc";
import { useEffect, useRef } from "react";

declare global {
  interface Window { adsbygoogle?: unknown[]; }
}

function GoogleAdSlot({ publisherId, slotCode, label }: { publisherId: string; slotCode: string; label: string }) {
  const adRef = useRef<HTMLModElement>(null);
  useEffect(() => {
    if (!adRef.current) return;
    const adNode = adRef.current;
    const scriptId = `adsense-script-${publisherId}`;
    const requestAd = () => { if (adNode.dataset.adsenseRequested === "true") return; adNode.dataset.adsenseRequested = "true"; try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch { /* يمنع فشل شبكة الإعلان من التأثير في الصفحة */ } };
    const existingScript = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (existingScript) {
      if (existingScript.dataset.loaded === "true") requestAd();
      else existingScript.addEventListener("load", requestAd, { once: true });
      return () => existingScript.removeEventListener("load", requestAd);
    }
    const script = document.createElement("script");
    script.id = scriptId;
    script.async = true;
    script.crossOrigin = "anonymous";
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${publisherId}`;
    script.addEventListener("load", () => { script.dataset.loaded = "true"; requestAd(); }, { once: true });
    document.head.appendChild(script);
  }, [publisherId, slotCode]);
  return <ins ref={adRef} className="adsbygoogle block min-h-[90px]" style={{ display: "block" }} data-ad-client={publisherId} data-ad-slot={slotCode} data-ad-format="auto" data-full-width-responsive="true" aria-label={label} />;
}

export default function AdPlacement({ placement }: { placement: "home" | "category" | "novel" }) {
  const { data } = trpc.ads.placement.useQuery({ placement });
  const adSenseSlots = data?.filter(slot => slot.provider === "adsense" && slot.adSensePublisherId && slot.slotCode) ?? [];
  if (!adSenseSlots.length) return null;
  return <aside className="my-10" aria-label="إعلانات"><span className="mb-2 block text-center text-[10px] font-bold tracking-[.16em] text-muted-foreground">إعلان</span>{adSenseSlots.map(slot => <GoogleAdSlot key={slot.id} publisherId={slot.adSensePublisherId!} slotCode={slot.slotCode!} label={slot.label} />)}</aside>;
}
