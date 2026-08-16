import AdminShell from "@/components/AdminShell";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { trpc } from "@/lib/trpc";
import { Link2, Megaphone, Pencil, Plus, Save, Trash2, Unplug, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type Placement = "home" | "category" | "novel";
type AdForm = { id?: number; placement: Placement; label: string; adSensePublisherId: string; slotCode: string; isEnabled: boolean };
const blankForm = (): AdForm => ({ placement: "home", label: "", adSensePublisherId: "", slotCode: "", isEnabled: false });
const placementLabels: Record<Placement, string> = { home: "الرئيسية", category: "التصنيفات", novel: "صفحة الرواية" };

export default function AdminAds() {
  const utils = trpc.useUtils();
  const { data } = trpc.ads.list.useQuery();
  const { data: connection, isLoading: isConnectionLoading } = trpc.ads.connection.useQuery();
  const [form, setForm] = useState<AdForm>(blankForm);
  const [slotPendingDeletion, setSlotPendingDeletion] = useState<{ id: number; label: string }>();
  const save = trpc.ads.upsert.useMutation({ onSuccess: () => { toast.success(form.id ? "حُدّث موضع الإعلان." : "أُنشئ موضع الإعلان."); setForm(blankForm()); utils.ads.list.invalidate(); }, onError: error => toast.error(error.message) });
  const deleteSlot = trpc.ads.delete.useMutation({ onSuccess: () => { toast.success("حُذف موضع الإعلان."); setSlotPendingDeletion(undefined); utils.ads.list.invalidate(); }, onError: error => toast.error(error.message) });
  const disconnect = trpc.ads.disconnect.useMutation({ onSuccess: () => { toast.success("فُصل حساب Google AdSense."); utils.ads.connection.invalidate(); }, onError: error => toast.error(error.message) });
  useEffect(() => { const publisherId = connection?.publisherId; if (publisherId) setForm(current => current.adSensePublisherId ? current : { ...current, adSensePublisherId: publisherId }); }, [connection?.publisherId]);
  const edit = (item: NonNullable<typeof data>[number]) => setForm({ id: item.id, placement: item.placement as Placement, label: item.label, adSensePublisherId: item.adSensePublisherId || "", slotCode: item.slotCode || "", isEnabled: item.isEnabled });

  return <AdminShell requireAdmin title="إعلانات Google AdSense" description="أدخل معرّف الناشر ورمز موضع الإعلان لتُعرض الإعلانات الحقيقية في الصفحات العامة فقط. صفحة القراءة مستثناة دائمًا.">
    <section className="mb-7 rounded-2xl border border-primary/25 bg-primary/5 p-5"><div className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-xs font-bold tracking-[.14em] text-primary">الربط المباشر</p><h2 className="mt-1 font-serif text-2xl">حساب Google AdSense</h2>{isConnectionLoading ? <p className="mt-2 text-sm text-muted-foreground">جارٍ التحقق من حالة الربط...</p> : connection ? <p className="mt-2 text-sm text-muted-foreground">متصل بالحساب <strong className="text-foreground">{connection.displayName}</strong>{connection.publisherId ? <> · <span dir="ltr">{connection.publisherId}</span></> : null}</p> : <p className="mt-2 text-sm text-muted-foreground">اربط حسابك مباشرة عبر Google ليتحقق النظام من حساب AdSense ومعرّف الناشر.</p>}</div>{connection ? <Button type="button" variant="outline" className="border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive" disabled={disconnect.isPending} onClick={() => disconnect.mutate()}><Unplug className="ml-2 h-4 w-4" />{disconnect.isPending ? "جارٍ الفصل..." : "فصل الحساب"}</Button> : <Button type="button" onClick={() => window.location.assign("/api/adsense/oauth/start")}><Link2 className="ml-2 h-4 w-4" />ربط Google AdSense</Button>}</div></section>
    <div className="mb-7 rounded-2xl border border-amber-300/45 bg-amber-50 p-4 text-sm leading-7 text-amber-950">استخدم معرّف الناشر بالشكل <code dir="ltr">ca-pub-1234567890123456</code> ورمز الموضع الرقمي من حساب Google AdSense. لا تُفعّل موضعًا قبل الموافقة على الموقع وإعداد وحدته في AdSense.</div>
    <div className="grid gap-7 lg:grid-cols-[400px_1fr]">
      <form className="rounded-2xl border border-[#1d2940]/10 bg-white p-5" onSubmit={event => { event.preventDefault(); save.mutate({ ...form, provider: "adsense" }); }}>
        <div className="flex items-center justify-between gap-3"><div><h2 className="font-serif text-2xl">{form.id ? "تعديل موضع" : "موضع AdSense جديد"}</h2><p className="mt-1 text-xs text-[#667085]">الحقول مطلوبة عند التفعيل.</p></div><Megaphone className="h-5 w-5 text-[#af7c42]" /></div>
        <div className="mt-5 grid gap-4">
          <div className="grid gap-2"><Label>الصفحة</Label><Select value={form.placement} onValueChange={value => setForm(current => ({ ...current, placement: value as Placement }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="home">الرئيسية</SelectItem><SelectItem value="category">التصنيفات</SelectItem><SelectItem value="novel">صفحة الرواية</SelectItem></SelectContent></Select></div>
          <div className="grid gap-2"><Label>اسم الموضع داخل الإدارة</Label><Input required value={form.label} onChange={event => setForm(current => ({ ...current, label: event.target.value }))} placeholder="مثل: بانر بعد أقسام الرئيسية" /></div>
          <div className="grid gap-2"><Label>معرّف ناشر AdSense</Label><Input dir="ltr" value={form.adSensePublisherId} onChange={event => setForm(current => ({ ...current, adSensePublisherId: event.target.value.trim() }))} placeholder="ca-pub-1234567890123456" /></div>
          <div className="grid gap-2"><Label>رمز موضع الإعلان</Label><Input dir="ltr" inputMode="numeric" value={form.slotCode} onChange={event => setForm(current => ({ ...current, slotCode: event.target.value.trim() }))} placeholder="1234567890" /></div>
          <label className="flex items-center justify-between rounded-lg border border-[#1d2940]/10 px-3 py-3 text-sm font-medium"><span>تفعيل الموضع للزوار</span><Switch checked={form.isEnabled} onCheckedChange={value => setForm(current => ({ ...current, isEnabled: value }))} /></label>
        </div>
        <div className="mt-5 flex gap-3"><Button className="bg-[#1d2940]" type="submit" disabled={save.isPending}>{form.id ? <Save className="ml-2 h-4 w-4" /> : <Plus className="ml-2 h-4 w-4" />}{save.isPending ? "جارٍ الحفظ..." : form.id ? "حفظ التعديل" : "إنشاء الموضع"}</Button>{form.id && <Button type="button" variant="outline" onClick={() => setForm(blankForm())}><X className="ml-2 h-4 w-4" />إلغاء التعديل</Button>}</div>
      </form>
      <section className="rounded-2xl border border-[#1d2940]/10 bg-white p-5"><h2 className="font-serif text-2xl">المواضع الحالية</h2><div className="mt-4 divide-y divide-[#1d2940]/8">{data?.length ? data.map(item => <article key={item.id} className="flex items-center justify-between gap-4 py-4"><div className="min-w-0"><strong className="block">{item.label}</strong><p className="mt-1 text-xs text-[#667085]">{placementLabels[item.placement as Placement]} · <span dir="ltr">{item.adSensePublisherId || "غير مكتمل"}</span> · موضع <span dir="ltr">{item.slotCode || "—"}</span></p></div><div className="flex shrink-0 items-center gap-1"><span className={`ml-2 text-xs font-semibold ${item.isEnabled ? "text-[#317251]" : "text-[#667085]"}`}>{item.isEnabled ? "مفعل" : "معطل"}</span><Button type="button" variant="ghost" size="icon" aria-label={`تعديل ${item.label}`} onClick={() => edit(item)}><Pencil className="h-4 w-4" /></Button><Button type="button" variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 hover:text-destructive" aria-label={`حذف ${item.label}`} onClick={() => setSlotPendingDeletion({ id: item.id, label: item.label })}><Trash2 className="h-4 w-4" /></Button></div></article>) : <p className="py-8 text-sm text-[#667085]">لا توجد مواضع إعلانية بعد.</p>}</div></section>
    </div>
    <AlertDialog open={Boolean(slotPendingDeletion)} onOpenChange={open => !open && !deleteSlot.isPending && setSlotPendingDeletion(undefined)}><AlertDialogContent dir="rtl"><AlertDialogHeader><AlertDialogTitle>حذف موضع «{slotPendingDeletion?.label}»؟</AlertDialogTitle><AlertDialogDescription>سيتوقف عرض هذا الموضع فورًا على الصفحات العامة. لا يؤثر الحذف في محتوى الروايات أو في صفحة القراءة.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel disabled={deleteSlot.isPending}>إلغاء</AlertDialogCancel><AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={deleteSlot.isPending || !slotPendingDeletion} onClick={event => { event.preventDefault(); if (slotPendingDeletion) deleteSlot.mutate({ id: slotPendingDeletion.id }); }}>{deleteSlot.isPending ? "جارٍ الحذف..." : "حذف الموضع"}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </AdminShell>;
}
