import AdminShell from "@/components/AdminShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { DEFAULT_LEGAL_DOCUMENTS_CONTENT } from "@/pages/Legal";
import { Plus, Save, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type DocumentKey = "privacy" | "terms" | "content" | "copyright" | "contact";
type LegalSection = { heading: string; body: string };
type LegalDocument = { title: string; intro: string; notice?: string; sections: LegalSection[] };
type LegalDocuments = Record<DocumentKey, LegalDocument>;

const documentLabels: Record<DocumentKey, string> = { privacy: "الخصوصية", terms: "شروط الاستخدام", content: "سياسة المحتوى", copyright: "حقوق النشر", contact: "تواصل معنا" };
const keys = Object.keys(documentLabels) as DocumentKey[];
const cloneDefaults = (): LegalDocuments => structuredClone(DEFAULT_LEGAL_DOCUMENTS_CONTENT) as LegalDocuments;

export default function AdminLegalDocuments() {
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.platform.admin.get.useQuery();
  const [documents, setDocuments] = useState<LegalDocuments>(() => cloneDefaults());
  const [selectedKey, setSelectedKey] = useState<DocumentKey>("privacy");
  const save = trpc.platform.admin.saveLegalDocuments.useMutation({
    onSuccess: async () => { await utils.platform.legalDocuments.invalidate(); await utils.platform.admin.get.invalidate(); toast.success("تم حفظ الوثائق القانونية."); },
    onError: error => toast.error(error.message),
  });

  useEffect(() => {
    if (!data?.legalDocuments) return;
    setDocuments(current => ({ ...current, ...(data.legalDocuments as Partial<LegalDocuments>) }));
  }, [data]);

  const selected = documents[selectedKey];
  const updateDocument = (patch: Partial<LegalDocument>) => setDocuments(current => ({ ...current, [selectedKey]: { ...current[selectedKey], ...patch } }));
  const updateSection = (index: number, patch: Partial<LegalSection>) => updateDocument({ sections: selected.sections.map((section, sectionIndex) => sectionIndex === index ? { ...section, ...patch } : section) });
  const removeSection = (index: number) => updateDocument({ sections: selected.sections.filter((_, sectionIndex) => sectionIndex !== index) });
  const addSection = () => updateDocument({ sections: [...selected.sections, { heading: "عنوان القسم", body: "اكتب محتوى هذا القسم هنا." }] });

  if (isLoading || !selected) return <AdminShell title="الوثائق القانونية" description="تحرير صفحات المنصة القانونية." requireAdmin><div className="grid min-h-80 place-items-center"><div className="h-9 w-9 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div></AdminShell>;
  return <AdminShell title="الوثائق القانونية" description="عدّل محتوى الصفحات القانونية التي تظهر للزوار، ثم احفظ النسخة المنشورة." requireAdmin>
    <div className="grid gap-6 lg:grid-cols-[220px_1fr]" dir="rtl">
      <aside className="h-fit rounded-2xl border border-border bg-card p-3"><p className="px-3 pb-3 text-sm font-bold text-muted-foreground">اختر الوثيقة</p><div className="grid gap-1">{keys.map(key => <button key={key} type="button" onClick={() => setSelectedKey(key)} className={`rounded-xl px-3 py-3 text-right text-sm font-semibold transition-colors ${selectedKey === key ? "bg-primary text-primary-foreground" : "hover:bg-accent"}`}>{documentLabels[key]}</button>)}</div></aside>
      <section className="rounded-2xl border border-border bg-card p-5 text-card-foreground md:p-7"><div className="mb-6 rounded-xl border border-amber-300/40 bg-amber-50 p-4 text-sm leading-7 text-amber-950">تُحفظ التعديلات فور الضغط على زر الحفظ وتظهر للزوار بعد تحديث الصفحة. راجع النصوص قانونيًا قبل اعتمادها النهائي، ولا تضع أسرارًا أو بيانات شخصية داخل الوثيقة.</div><div className="grid gap-5"><div className="grid gap-2"><Label>عنوان الصفحة</Label><Input value={selected.title} onChange={event => updateDocument({ title: event.target.value })} /></div><div className="grid gap-2"><Label>المقدمة</Label><Textarea value={selected.intro} onChange={event => updateDocument({ intro: event.target.value })} className="min-h-28" /></div><div className="grid gap-2"><Label>تنبيه اختياري يظهر أعلى الصفحة</Label><Textarea value={selected.notice ?? ""} onChange={event => updateDocument({ notice: event.target.value || undefined })} placeholder="اتركه فارغًا لإخفائه" className="min-h-20" /></div><div className="flex items-center justify-between border-t border-border pt-5"><h2 className="font-serif text-2xl">أقسام الوثيقة</h2><Button type="button" variant="outline" onClick={addSection}><Plus className="ml-2 h-4 w-4" />إضافة قسم</Button></div>{selected.sections.map((section, index) => <article key={`${selectedKey}-${index}`} className="grid gap-3 rounded-2xl border border-border bg-background p-4"><div className="flex items-center justify-between gap-3"><Label>القسم {index + 1}</Label><Button type="button" variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => removeSection(index)} aria-label={`حذف القسم ${index + 1}`}><Trash2 className="h-4 w-4" /></Button></div><Input value={section.heading} onChange={event => updateSection(index, { heading: event.target.value })} placeholder="عنوان القسم" /><Textarea value={section.body} onChange={event => updateSection(index, { body: event.target.value })} className="min-h-32" placeholder="محتوى القسم" /></article>)}<Button type="button" onClick={() => save.mutate({ documents })} disabled={save.isPending}><Save className="ml-2 h-4 w-4" />{save.isPending ? "جارٍ الحفظ..." : "حفظ الوثائق القانونية"}</Button></div></section>
    </div>
  </AdminShell>;
}
