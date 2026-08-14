import { trpc } from "@/lib/trpc";

export default function AdPlacement({ placement }: { placement: "home" | "category" | "novel" }) {
  const { data } = trpc.ads.placement.useQuery({ placement });
  if (!data?.length) return null;
  return <div className="my-10 rounded-2xl border border-dashed border-[#af7c42]/45 bg-[#fbf8f2] px-6 py-5 text-center"><span className="text-[10px] font-bold tracking-[.16em] text-[#af7c42]">إعلان</span>{data.map(slot => <div key={slot.id} className="mt-1 text-sm text-[#667085]">{slot.label}</div>)}</div>;
}
