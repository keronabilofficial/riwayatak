import AdminShell from "@/components/AdminShell";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { CheckCircle2, Clock3, DatabaseBackup, FileCheck2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

export default function AdminOperations() {
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.operations.status.useQuery();
  const runSnapshot = trpc.operations.runSnapshotNow.useMutation({ onSuccess: () => { toast.success("اكتملت لقطة المحتوى وتحُقق من سلامتها."); utils.operations.status.invalidate(); }, onError: error => toast.error(error.message) });
  const runReport = trpc.operations.runReportNow.useMutation({ onSuccess: result => toast.success(result.ownerNotified ? "أُرسل التقرير إلى مالك المنصة." : "تم إعداد التقرير، لكن الإرسال لم يكتمل."), onError: error => toast.error(error.message) });
  const latest = data?.backups[0];
  return <AdminShell title="التشغيل والاستمرارية" description="راقب اللقطات الاحتياطية، شغّل التحقق يدويًا، وجهّز جداول Heartbeat بعد نشر المنصة.">
    <div className="grid gap-4 md:grid-cols-2">
      <article className="rounded-2xl border border-[#1d2940]/10 bg-white p-6"><div className="flex items-center justify-between"><DatabaseBackup className="h-6 w-6 text-[#af7c42]" /><span className={`inline-flex items-center gap-1 text-xs font-semibold ${latest?.status === "verified" ? "text-[#317251]" : "text-[#af7c42]"}`}><CheckCircle2 className="h-3.5 w-3.5" />{latest ? latest.status : "لم تبدأ"}</span></div><h2 className="mt-6 font-serif text-2xl">النسخ الاحتياطي المتقدم</h2><p className="mt-3 text-sm leading-7 text-[#667085]">تُنشأ لقطة محتوى قابلة للتحقق، تُشفّر ببصمة SHA-256، وتحفظ في التخزين الخارجي لمدة 90 يومًا.</p><Button className="mt-5 bg-[#1d2940]" onClick={() => runSnapshot.mutate()} disabled={runSnapshot.isPending}>{runSnapshot.isPending ? "جارٍ إنشاء اللقطة..." : "تشغيل نسخة الآن"}</Button></article>
      <article className="rounded-2xl border border-[#1d2940]/10 bg-white p-6"><div className="flex items-center justify-between"><Clock3 className="h-6 w-6 text-[#af7c42]" /><span className="inline-flex items-center gap-1 text-xs font-semibold text-[#af7c42]"><CheckCircle2 className="h-3.5 w-3.5" />مهيأ للتفعيل</span></div><h2 className="mt-6 font-serif text-2xl">التقرير اليومي</h2><p className="mt-3 text-sm leading-7 text-[#667085]">يلخص التقرير حالة النسخ وحجم المحتوى ثم يرسل للمالك عبر قناة الإشعارات.</p><Button variant="outline" className="mt-5 border-[#1d2940]/20 bg-transparent" onClick={() => runReport.mutate()} disabled={runReport.isPending}>{runReport.isPending ? "جارٍ الإرسال..." : "إرسال تقرير الآن"}</Button></article>
      <article className="rounded-2xl border border-[#1d2940]/10 bg-white p-6"><ShieldCheck className="h-6 w-6 text-[#af7c42]" /><h2 className="mt-6 font-serif text-2xl">مهام Heartbeat الآمنة</h2><p className="mt-3 text-sm leading-7 text-[#667085]">نقاط الجدولة محمية بهوية مهمة دورية، وتستدل على المهمة من معرّف موثوق لا من بيانات الطلب.</p></article>
      <article className="rounded-2xl border border-[#1d2940]/10 bg-white p-6"><FileCheck2 className="h-6 w-6 text-[#af7c42]" /><h2 className="mt-6 font-serif text-2xl">تفعيل الجداول</h2><p className="mt-3 text-sm leading-7 text-[#667085]">بعد حفظ نسخة قابلة للنشر ونشر المنصة، فعّل النسخة اليومية والتقرير من هذه اللوحة. لا تُشغّل الجداول على بيئة المعاينة.</p></article>
    </div>
    <section className="mt-7 rounded-2xl border border-[#1d2940]/10 bg-white p-6"><h2 className="font-serif text-2xl">سجل اللقطات الأخيرة</h2>{isLoading ? <p className="mt-5 text-sm text-[#667085]">جارٍ التحميل...</p> : data?.backups.length ? <div className="mt-4 divide-y divide-[#1d2940]/8">{data.backups.map(backup => <div key={backup.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm"><span><b className="ml-2 text-[#af7c42]">{backup.kind}</b>{backup.status}</span><span className="text-xs text-[#667085]">{backup.sizeBytes ? `${(backup.sizeBytes / 1024).toFixed(1)} KB` : "—"} · {new Date(backup.createdAt).toLocaleString("ar")}</span></div>)}</div> : <p className="mt-5 text-sm text-[#667085]">لم تنفّذ لقطة احتياطية بعد.</p>}</section>
  </AdminShell>;
}
