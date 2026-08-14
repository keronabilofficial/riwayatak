import AdminShell from "@/components/AdminShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { ImagePlus, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

export default function AdminMedia() {
  const inputRef = useRef<HTMLInputElement>(null);
  const utils = trpc.useUtils();
  const { data } = trpc.media.list.useQuery();
  const [altText, setAltText] = useState("");
  const upload = trpc.media.upload.useMutation({ onSuccess: () => { toast.success("رُفعت الصورة وحُفظ مرجعها."); setAltText(""); if (inputRef.current) inputRef.current.value = ""; utils.media.list.invalidate(); }, onError: error => toast.error(error.message) });
  const handleFile = (file?: File) => { if (!file) return; const reader = new FileReader(); reader.onload = () => upload.mutate({ fileName: file.name, contentType: file.type as "image/jpeg" | "image/png" | "image/webp" | "image/gif", dataBase64: String(reader.result), altText: altText || undefined }); reader.readAsDataURL(file); };
  return <AdminShell title="مكتبة الوسائط" description="ارفع أغلفة الروايات وصور المؤلفين؛ تحفظ المنصة مرجع التخزين الخارجي وبيانات الملف فقط."><section className="rounded-2xl border border-[#1d2940]/10 bg-white p-6"><div className="flex items-center gap-2"><ImagePlus className="h-5 w-5 text-[#af7c42]" /><h2 className="font-serif text-2xl">رفع صورة</h2></div><p className="mt-2 text-sm text-[#667085]">الصيغ المدعومة: JPEG وPNG وWebP وGIF بحجم أقصى 3 ميغابايت.</p><div className="mt-5 flex flex-wrap items-center gap-3"><Input value={altText} onChange={event => setAltText(event.target.value)} placeholder="نص بديل وصفي (اختياري)" className="max-w-md" /><input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={event => handleFile(event.target.files?.[0])} /><Button className="bg-[#1d2940]" onClick={() => inputRef.current?.click()} disabled={upload.isPending}><Upload className="ml-2 h-4 w-4" />{upload.isPending ? "جارٍ الرفع..." : "اختر صورة"}</Button></div></section><section className="mt-7"><h2 className="font-serif text-3xl">الملفات الأخيرة</h2><div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">{data?.map(item => <article key={item.id} className="overflow-hidden rounded-xl border border-[#1d2940]/10 bg-white"><img src={item.url} alt={item.altText || "صورة مرفوعة"} className="aspect-square w-full object-cover" /><div className="p-3"><p className="text-xs font-bold">مرجع #{item.id}</p><p className="mt-1 truncate text-[11px] text-[#667085]">{item.mimeType}</p></div></article>)}</div>{!data?.length && <p className="mt-5 text-sm text-[#667085]">لم تُرفع صور بعد.</p>}</section></AdminShell>;
}
