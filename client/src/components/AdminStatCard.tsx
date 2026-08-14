import type { LucideIcon } from "lucide-react";

export default function AdminStatCard({ label, value, icon: Icon, tone = "navy" }: { label: string; value: number; icon: LucideIcon; tone?: "navy" | "gold" | "sage" | "rose" }) {
  const tones = { navy: "bg-[#1d2940] text-[#f6f1e7]", gold: "bg-[#d5a85e] text-[#1d2940]", sage: "bg-[#dce7df] text-[#1d2940]", rose: "bg-[#f2deda] text-[#1d2940]" };
  return <div className={`rounded-2xl p-5 ${tones[tone]}`}><Icon className="h-5 w-5 opacity-80"/><p className="mt-7 text-xs font-bold opacity-70">{label}</p><p className="mt-1 font-serif text-4xl">{value.toLocaleString("ar")}</p></div>;
}
