import AdminShell from "@/components/AdminShell";
import { Button } from "@/components/ui/button";
import MediaPicker from "@/components/MediaPicker";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { Archive, Edit3, Eye, EyeOff, Plus, UserRound } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type AuthorForm = { id?: number; name: string; displayName: string; slug: string; shortBio: string; biography: string; imageMediaId: string; isVisible: boolean };
const empty: AuthorForm = { name: "", displayName: "", slug: "", shortBio: "", biography: "", imageMediaId: "", isVisible: true };

export default function AdminAuthors() {
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.admin.listAuthors.useQuery({ limit: 48 });
  const [form, setForm] = useState<AuthorForm>(empty);
  const set = (key: keyof AuthorForm, value: string | boolean) => setForm(current => ({ ...current, [key]: value }));
  const mutation = trpc.admin.upsertAuthor.useMutation({ onSuccess: () => { toast.success("حُفظ ملف المؤلف."); setForm(empty); utils.admin.listAuthors.invalidate(); }, onError: () => toast.error("تعذر حفظ ملف المؤلف.") });
  const archive = trpc.admin.archiveAuthor.useMutation({ onSuccess: () => { toast.success("نُقل المؤلف إلى الأرشيف."); utils.admin.listAuthors.invalidate(); } });
  const edit = (author: NonNullable<typeof data>[number]) => setForm({ id: author.id, name: author.name, displayName: author.displayName, slug: author.slug, shortBio: author.shortBio || "", biography: author.biography || "", imageMediaId: author.imageMediaId ? String(author.imageMediaId) : "", isVisible: author.visible });
  return <AdminShell title="المؤلفون" description="أنشئ ملفات المؤلفين المستقلة، ثم عدّلها أو أخفها من المكتبة عند الحاجة.">
    <div className="grid gap-7 lg:grid-cols-[380px_1fr]">
      <form className="rounded-2xl border border-[#1d2940]/10 bg-white p-5" onSubmit={event => { event.preventDefault(); mutation.mutate({ id: form.id, name: form.name, displayName: form.displayName || undefined, slug: form.slug || undefined, shortBio: form.shortBio || undefined, biography: form.biography || undefined, imageMediaId: form.imageMediaId ? Number(form.imageMediaId) : null, isVisible: form.isVisible }); }}>
        <div className="flex items-center justify-between"><h2 className="font-serif text-2xl">{form.id ? "تعديل المؤلف" : "إضافة مؤلف"}</h2><Plus className="h-5 w-5 text-[#af7c42]" /></div>
        <div className="mt-5 grid gap-3"><Input required value={form.name} onChange={event => set("name", event.target.value)} placeholder="الاسم" /><Input value={form.displayName} onChange={event => set("displayName", event.target.value)} placeholder="الاسم الظاهر (اختياري)" /><Input value={form.slug} onChange={event => set("slug", event.target.value)} placeholder="الرابط الثابت" /><MediaPicker label="صورة المؤلف" value={form.imageMediaId} onChange={value => set("imageMediaId", value)} /><Textarea value={form.shortBio} onChange={event => set("shortBio", event.target.value)} placeholder="نبذة قصيرة" /><Textarea value={form.biography} onChange={event => set("biography", event.target.value)} placeholder="السيرة المختصرة" className="min-h-28" /></div>
        <button type="button" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#526071]" onClick={() => set("isVisible", !form.isVisible)}>{form.isVisible ? <Eye className="h-4 w-4 text-[#317251]" /> : <EyeOff className="h-4 w-4 text-[#a63a32]" />}{form.isVisible ? "ظاهر في المكتبة" : "مخفي عن المكتبة"}</button>
        <div className="mt-4 flex gap-2"><Button type="submit" disabled={mutation.isPending} className="bg-[#1d2940]">{mutation.isPending ? "جارٍ الحفظ..." : "حفظ"}</Button>{form.id && <Button type="button" variant="ghost" onClick={() => setForm(empty)}>إلغاء التعديل</Button>}</div>
      </form>
      <section className="rounded-2xl border border-[#1d2940]/10 bg-white p-5"><h2 className="font-serif text-2xl">ملفات المؤلفين</h2><div className="mt-4 divide-y divide-[#1d2940]/8">{isLoading ? <p className="py-8 text-sm text-[#667085]">جارٍ التحميل...</p> : data?.length ? data.map(author => <div key={author.id} className="flex items-center justify-between gap-4 py-4"><div className="flex min-w-0 items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-full bg-[#e9dfca] text-[#af7c42]"><UserRound className="h-4 w-4" /></span><span className="min-w-0"><strong className="block truncate">{author.displayName}</strong><small className="text-[#667085]">/{author.slug} · {author.visible ? "ظاهر" : "مخفي"}</small></span></div><div className="flex gap-1"><Button variant="ghost" size="icon" onClick={() => edit(author)} aria-label="تعديل"><Edit3 className="h-4 w-4" /></Button><Button variant="ghost" size="icon" onClick={() => archive.mutate({ id: author.id })} aria-label="أرشفة"><Archive className="h-4 w-4 text-[#a63a32]" /></Button></div></div>) : <p className="py-8 text-center text-sm text-[#667085]">لم تضف ملفات مؤلفين بعد.</p>}</div></section>
    </div>
  </AdminShell>;
}
