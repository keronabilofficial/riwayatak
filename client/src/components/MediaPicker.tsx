import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";

export default function MediaPicker({ value, onChange, label }: { value: string; onChange: (value: string) => void; label: string }) {
  const { data } = trpc.media.list.useQuery();
  const selected = data?.find(item => item.id === Number(value));
  return <div><p className="mb-2 text-xs font-semibold text-[#526071]">{label}</p><div className="flex gap-3"><Select value={value || "none"} onValueChange={next => onChange(next === "none" ? "" : next)}><SelectTrigger><SelectValue placeholder="اختر صورة من المكتبة" /></SelectTrigger><SelectContent><SelectItem value="none">بلا صورة</SelectItem>{data?.map(item => <SelectItem key={item.id} value={String(item.id)}>صورة #{item.id} · {item.altText || item.mimeType}</SelectItem>)}</SelectContent></Select>{selected && <img src={selected.url} alt={selected.altText || label} className="h-10 w-10 rounded-lg border border-[#1d2940]/10 object-cover" />}</div></div>;
}
