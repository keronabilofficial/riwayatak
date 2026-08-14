import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { FileAudio, Trash2, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

const acceptedTypes = ["audio/mpeg", "audio/mp4", "audio/aac", "audio/ogg", "audio/wav", "audio/webm"] as const;
type AcceptedType = (typeof acceptedTypes)[number];

export default function ChapterAudioUploader({ chapterId }: { chapterId: number }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const utils = trpc.useUtils();
  const { data } = trpc.audio.list.useQuery();
  const [durationSeconds, setDurationSeconds] = useState("");
  const current = data?.find(item => item.chapterId === chapterId);
  const upload = trpc.audio.upload.useMutation({ onSuccess: () => { toast.success("حُفظ التسجيل الصوتي للفصل."); if (inputRef.current) inputRef.current.value = ""; utils.audio.list.invalidate(); }, onError: error => toast.error(error.message) });
  const remove = trpc.audio.remove.useMutation({ onSuccess: () => { toast.success("أُزيل مرجع التسجيل الصوتي."); utils.audio.list.invalidate(); }, onError: error => toast.error(error.message) });
  const pick = (file?: File) => { if (!file) return; if (!acceptedTypes.includes(file.type as AcceptedType)) return toast.error("اختر ملفًا صوتيًا بصيغة MP3 أو M4A أو AAC أو OGG أو WAV أو WebM."); const reader = new FileReader(); reader.onload = () => upload.mutate({ chapterId, fileName: file.name, contentType: file.type as AcceptedType, dataBase64: String(reader.result), durationSeconds: durationSeconds ? Number(durationSeconds) : undefined }); reader.readAsDataURL(file); };
  return <aside className="mt-5 rounded-xl border border-dashed border-[#af7c42]/45 bg-[#fbf8f2] p-4"><div className="flex items-center justify-between gap-3"><div><p className="flex items-center gap-2 text-sm font-bold"><FileAudio className="h-4 w-4 text-[#af7c42]" />تسجيل الفصل الصوتي</p><p className="mt-1 text-xs text-[#667085]">يمكن رفعه قبل النشر أو خلال سبعة أيام من نشر الفصل.</p></div>{current && <audio controls preload="metadata" src={current.url} className="max-w-[180px]" />}</div><div className="mt-3 flex flex-wrap items-center gap-2"><Input value={durationSeconds} onChange={event => setDurationSeconds(event.target.value)} type="number" min="1" placeholder="المدة بالثواني (اختياري)" className="w-52" /><input ref={inputRef} type="file" accept="audio/mpeg,audio/mp4,audio/aac,audio/ogg,audio/wav,audio/webm" className="hidden" onChange={event => pick(event.target.files?.[0])} /><Button type="button" className="bg-[#1d2940]" onClick={() => inputRef.current?.click()} disabled={upload.isPending}><Upload className="ml-2 h-4 w-4" />{upload.isPending ? "جارٍ الرفع..." : current ? "استبدال التسجيل" : "رفع تسجيل"}</Button>{current && <Button type="button" variant="outline" className="border-[#a63a32]/35 text-[#a63a32]" onClick={() => remove.mutate({ chapterId })} disabled={remove.isPending}><Trash2 className="ml-2 h-4 w-4" />حذف</Button>}</div></aside>;
}
