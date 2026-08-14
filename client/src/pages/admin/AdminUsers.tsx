import { useAuth } from "@/_core/hooks/useAuth";
import AdminShell from "@/components/AdminShell";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { trpc } from "@/lib/trpc";
import { Ban, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export default function AdminUsers() {
  const { user, loading } = useAuth();
  const isAdmin = user?.role === "admin" || user?.role === "super_admin";
  const utils = trpc.useUtils();
  const { data, isLoading, error } = trpc.admin.listUsers.useQuery({ limit: 48 }, { enabled: !loading && isAdmin });
  const update = trpc.admin.updateUserAccess.useMutation({ onSuccess: () => { toast.success("حُدّثت صلاحيات الحساب."); utils.admin.listUsers.invalidate(); }, onError: mutationError => toast.error(mutationError.message) });
  return <AdminShell requireAdmin title="المستخدمون والصلاحيات" description="اعرض الحسابات المسجلة، وحدد أدوارها، وعطّل الوصول عند الحاجة من طبقة الخادم.">
    {error ? <div className="rounded-2xl border border-[#a63a32]/30 bg-[#fff7f6] p-6 text-sm text-[#a63a32]">تعذر الوصول إلى قائمة المستخدمين. تأكد من صلاحيات مدير الحساب ثم أعد المحاولة.</div> : <section className="overflow-hidden rounded-2xl border border-[#1d2940]/10 bg-white"><div className="grid grid-cols-[1.5fr_.8fr_.7fr_auto] gap-4 border-b border-[#1d2940]/10 bg-[#e9dfca]/35 px-5 py-3 text-xs font-bold text-[#526071]"><span>الحساب</span><span>الدور</span><span>الحالة</span><span>إجراء</span></div>{isLoading ? <p className="p-8 text-center text-sm text-[#667085]">جارٍ تحميل الحسابات...</p> : data?.length ? data.map(account => <div key={account.id} className="grid grid-cols-[1.5fr_.8fr_.7fr_auto] items-center gap-4 border-b border-[#1d2940]/8 px-5 py-4 last:border-0"><span className="min-w-0"><strong className="block truncate">{account.name || "مستخدم بلا اسم"}</strong><small className="block truncate text-[#667085]">{account.email || new Date(account.createdAt).toLocaleString("ar")}</small></span><Select value={account.role} onValueChange={role => update.mutate({ id: account.id, role: role as "user" | "editor" | "admin" | "super_admin", isDisabled: account.isDisabled })}><SelectTrigger className="h-9"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="user">مستخدم</SelectItem><SelectItem value="editor">محرر</SelectItem><SelectItem value="admin">مدير</SelectItem><SelectItem value="super_admin">مدير النظام</SelectItem></SelectContent></Select><span className={`inline-flex items-center gap-1 text-xs font-semibold ${account.isDisabled ? "text-[#a63a32]" : "text-[#317251]"}`}>{account.isDisabled ? <Ban className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}{account.isDisabled ? "معطّل" : "مفعل"}</span><Switch checked={!account.isDisabled} onCheckedChange={checked => update.mutate({ id: account.id, role: account.role, isDisabled: !checked })} aria-label="تبديل حالة الحساب" /></div>) : <p className="p-8 text-center text-sm text-[#667085]">لا توجد حسابات مسجلة حتى الآن.</p>}</section>}
  </AdminShell>;
}
