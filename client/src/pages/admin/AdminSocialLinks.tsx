import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { trpc } from "@/lib/trpc";
import { Link2, Loader2, Plus, Save, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type SocialLink = { id: string; label: string; url: string; enabled: boolean; sortOrder: number };

const emptyLink = (index: number): SocialLink => ({ id: `social-${Date.now()}-${index}`, label: "", url: "https://", enabled: true, sortOrder: index });

export default function AdminSocialLinks() {
  const { data, isLoading } = trpc.platform.admin.get.useQuery();
  const [links, setLinks] = useState<SocialLink[]>([]);
  const save = trpc.platform.admin.saveSocialLinks.useMutation({ onSuccess: () => toast.success("تم حفظ روابط التواصل الاجتماعي."), onError: error => toast.error(error.message) });
  useEffect(() => { if (data?.socialLinks) setLinks(data.socialLinks); }, [data?.socialLinks]);
  const update = (index: number, patch: Partial<SocialLink>) => setLinks(current => current.map((link, itemIndex) => itemIndex === index ? { ...link, ...patch } : link));
  const add = () => setLinks(current => [...current, emptyLink(current.length)]);
  const remove = (index: number) => setLinks(current => current.filter((_, itemIndex) => itemIndex !== index).map((link, itemIndex) => ({ ...link, sortOrder: itemIndex })));
  const submit = () => save.mutate({ links: links.map((link, index) => ({ ...link, id: link.id.trim().toLowerCase(), label: link.label.trim(), url: link.url.trim(), sortOrder: index })) });
  return <DashboardLayout><main className="mx-auto w-full max-w-5xl p-6 md:p-10" dir="rtl"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="flex items-center gap-2 text-sm font-bold text-primary"><Link2 className="h-4 w-4" />إدارة الحضور الرقمي</p><h1 className="mt-2 font-serif text-4xl">روابط التواصل الاجتماعي</h1><p className="mt-3 max-w-2xl leading-7 text-muted-foreground">أضف روابط المنصة يدويًا، ثم اختر الروابط التي تظهر في فوتر الموقع. لا تُقبل إلا روابط HTTPS الآمنة.</p></div><Button variant="outline" onClick={add}><Plus className="ml-2 h-4 w-4" />إضافة رابط</Button></div><Card className="mt-8"><CardHeader><CardTitle>الروابط المضافة ({links.length})</CardTitle></CardHeader><CardContent className="grid gap-4">{isLoading ? <div className="grid place-items-center p-10"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div> : links.length ? links.map((link, index) => <div key={link.id} className="grid gap-4 rounded-2xl border border-border p-4 md:grid-cols-[150px_1fr_1.6fr_auto_auto] md:items-end"><div className="grid gap-2"><Label htmlFor={`social-id-${index}`}>المعرّف</Label><Input id={`social-id-${index}`} dir="ltr" value={link.id} onChange={event => update(index, { id: event.target.value })} placeholder="facebook" /></div><div className="grid gap-2"><Label htmlFor={`social-label-${index}`}>اسم المنصة</Label><Input id={`social-label-${index}`} value={link.label} onChange={event => update(index, { label: event.target.value })} placeholder="فيسبوك" /></div><div className="grid gap-2"><Label htmlFor={`social-url-${index}`}>الرابط</Label><Input id={`social-url-${index}`} dir="ltr" value={link.url} onChange={event => update(index, { url: event.target.value })} placeholder="https://facebook.com/..." /></div><label className="flex items-center gap-2 pb-2 text-sm font-semibold"><Switch checked={link.enabled} onCheckedChange={enabled => update(index, { enabled })} />مفعّل</label><Button type="button" variant="ghost" className="pb-2 text-destructive" onClick={() => remove(index)} aria-label={`حذف ${link.label || "الرابط"}`}><Trash2 className="h-4 w-4" /></Button></div>) : <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">لا توجد روابط بعد. أضف أول رابط ليظهر في فوتر المنصة.</div>}<div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5"><p className="text-xs leading-6 text-muted-foreground">تُحفظ الروابط المفعّلة فقط في العرض العام، وتفتح في تبويب جديد مع حماية noreferrer.</p><Button onClick={submit} disabled={save.isPending || isLoading}><Save className="ml-2 h-4 w-4" />{save.isPending ? "جارٍ الحفظ..." : "حفظ الروابط"}</Button></div></CardContent></Card></main></DashboardLayout>;
}
