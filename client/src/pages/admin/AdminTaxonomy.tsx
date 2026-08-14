import AdminShell from "@/components/AdminShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { BookMarked, Check, Plus, Tag } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function AdminTaxonomy() {
  const utils = trpc.useUtils();
  const { data: categories } = trpc.admin.listCategories.useQuery();
  const { data: tags } = trpc.admin.listTags.useQuery();
  const { data: novels } = trpc.admin.listNovels.useQuery({ limit: 48 });
  const [category, setCategory] = useState("");
  const [tag, setTag] = useState("");
  const [novelId, setNovelId] = useState<string>("");
  const { data: selectedTaxonomy } = trpc.admin.getNovelTaxonomy.useQuery({ novelId: Number(novelId) }, { enabled: Boolean(novelId) });
  const [categoryIds, setCategoryIds] = useState<number[]>([]);
  const [tagIds, setTagIds] = useState<number[]>([]);
  useEffect(() => { setCategoryIds(selectedTaxonomy?.categoryIds ?? []); setTagIds(selectedTaxonomy?.tagIds ?? []); }, [selectedTaxonomy]);
  const addCategory = trpc.admin.upsertCategory.useMutation({ onSuccess: () => { setCategory(""); utils.admin.listCategories.invalidate(); toast.success("أُضيف التصنيف."); } });
  const addTag = trpc.admin.upsertTag.useMutation({ onSuccess: () => { setTag(""); utils.admin.listTags.invalidate(); toast.success("أُضيف الوسم."); } });
  const save = trpc.admin.setNovelTaxonomy.useMutation({ onSuccess: () => toast.success("حُفظت روابط الرواية."), onError: () => toast.error("تعذر حفظ الروابط.") });
  const toggle = (id: number, current: number[], setter: (ids: number[]) => void) => setter(current.includes(id) ? current.filter(value => value !== id) : [...current, id]);

  return <AdminShell title="التصنيفات والوسوم" description="نظّم الاكتشاف بموضوعات واسعة ووسوم أكثر دقة، ثم اربطها بالروايات المنشأة.">
    <div className="grid gap-7 md:grid-cols-2">
      <section className="rounded-2xl border border-[#1d2940]/10 bg-white p-5"><h2 className="font-serif text-2xl">التصنيفات</h2><form className="mt-4 flex gap-2" onSubmit={event => { event.preventDefault(); if (category.trim()) addCategory.mutate({ name: category }); }}><Input value={category} onChange={event => setCategory(event.target.value)} placeholder="مثل: غموض" /><Button type="submit" size="icon" className="bg-[#1d2940]" aria-label="إضافة تصنيف"><Plus className="h-4 w-4" /></Button></form><div className="mt-5 flex flex-wrap gap-2">{categories?.length ? categories.map(item => <span key={item.id} className="rounded-full bg-[#e9dfca] px-3 py-1.5 text-sm">{item.name}</span>) : <p className="text-sm text-[#667085]">أضف التصنيف الأول.</p>}</div></section>
      <section className="rounded-2xl border border-[#1d2940]/10 bg-white p-5"><h2 className="font-serif text-2xl">الوسوم</h2><form className="mt-4 flex gap-2" onSubmit={event => { event.preventDefault(); if (tag.trim()) addTag.mutate({ name: tag }); }}><Input value={tag} onChange={event => setTag(event.target.value)} placeholder="مثل: مدينة غامضة" /><Button type="submit" size="icon" className="bg-[#1d2940]" aria-label="إضافة وسم"><Plus className="h-4 w-4" /></Button></form><div className="mt-5 flex flex-wrap gap-2">{tags?.length ? tags.map(item => <span key={item.id} className="inline-flex items-center gap-1 rounded-full border border-[#af7c42]/35 px-3 py-1.5 text-sm text-[#af7c42]"><Tag className="h-3 w-3" />{item.name}</span>) : <p className="text-sm text-[#667085]">أضف الوسم الأول.</p>}</div></section>
    </div>
    <section className="mt-7 rounded-2xl border border-[#1d2940]/10 bg-white p-5"><div className="flex items-center gap-2"><BookMarked className="h-5 w-5 text-[#af7c42]" /><h2 className="font-serif text-2xl">ربط مفردات الرواية</h2></div><p className="mt-1 text-sm text-[#667085]">حدد رواية ثم اختر التصنيفات والوسوم التي يريد القارئ اكتشافها من خلالها.</p><div className="mt-5 max-w-md"><Select value={novelId} onValueChange={setNovelId}><SelectTrigger><SelectValue placeholder="اختر الرواية" /></SelectTrigger><SelectContent>{novels?.map(novel => <SelectItem key={novel.id} value={String(novel.id)}>{novel.title}</SelectItem>)}</SelectContent></Select></div>{novelId && <div className="mt-6 grid gap-6 lg:grid-cols-2"><div><h3 className="font-bold">التصنيفات المختارة</h3><div className="mt-3 flex flex-wrap gap-2">{categories?.map(item => <button type="button" key={item.id} onClick={() => toggle(item.id, categoryIds, setCategoryIds)} className={`inline-flex items-center gap-1 rounded-full px-3 py-2 text-sm transition ${categoryIds.includes(item.id) ? "bg-[#1d2940] text-white" : "bg-[#e9dfca] text-[#1d2940]"}`}>{categoryIds.includes(item.id) && <Check className="h-3.5 w-3.5" />}{item.name}</button>)}</div></div><div><h3 className="font-bold">الوسوم المختارة</h3><div className="mt-3 flex flex-wrap gap-2">{tags?.map(item => <button type="button" key={item.id} onClick={() => toggle(item.id, tagIds, setTagIds)} className={`inline-flex items-center gap-1 rounded-full px-3 py-2 text-sm transition ${tagIds.includes(item.id) ? "border border-[#af7c42] bg-[#af7c42] text-white" : "border border-[#af7c42]/35 text-[#af7c42]"}`}>{tagIds.includes(item.id) && <Check className="h-3.5 w-3.5" />}{item.name}</button>)}</div></div></div>} {novelId && <Button className="mt-7 bg-[#1d2940]" disabled={save.isPending} onClick={() => save.mutate({ novelId: Number(novelId), categoryIds, tagIds })}>{save.isPending ? "جارٍ الحفظ..." : "حفظ روابط الرواية"}</Button>}</section>
  </AdminShell>;
}
