import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function AdminShell({ children, title, description, requireAdmin = false }: { children: React.ReactNode; title: string; description: string; requireAdmin?: boolean }) {
  const { loading, user } = useAuth();
  if (loading) return <div className="grid min-h-screen place-items-center bg-[#f6f1e7]" dir="rtl"><div className="text-center"><div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-[#af7c42] border-t-transparent" /><p className="mt-4 text-sm text-[#667085]">جارٍ التحقق من صلاحية الإدارة...</p></div></div>;
  if (!user || user.role === "user") return <div className="grid min-h-screen place-items-center bg-[#f6f1e7] p-6 text-center" dir="rtl"><div><p className="text-xs font-bold tracking-[.16em] text-[#af7c42]">وصول محمي</p><h1 className="mt-3 font-serif text-4xl text-[#1d2940]">لا تملك صلاحية الوصول</h1><p className="mt-3 max-w-md text-sm leading-7 text-[#667085]">لوحة الإدارة متاحة للمحررين والمديرين فقط. اطلب من مدير المنصة تفعيل دورك إذا كنت تحتاج الوصول.</p><Link href="/"><Button className="mt-7 bg-[#1d2940]">العودة إلى الموقع</Button></Link></div></div>;
  if (requireAdmin && user.role !== "super_admin") return <div className="grid min-h-screen place-items-center bg-[#f6f1e7] p-6 text-center" dir="rtl"><div><p className="text-xs font-bold tracking-[.16em] text-[#af7c42]">وصول محمي</p><h1 className="mt-3 font-serif text-4xl text-[#1d2940]">تحتاج إلى صلاحية مدير النظام</h1><p className="mt-3 max-w-md text-sm leading-7 text-[#667085]">هذه الصفحة مخصصة لمدير النظام المسؤول عن إعدادات المنصة والأدوار الحساسة.</p><Link href="/admin"><Button className="mt-7 bg-[#1d2940]">العودة إلى الإدارة</Button></Link></div></div>;
  return <DashboardLayout><div className="mx-auto max-w-6xl" dir="rtl"><div className="mb-8 border-b border-[#1d2940]/10 pb-6"><p className="text-xs font-bold tracking-[.16em] text-[#af7c42]">لوحة الإدارة</p><h1 className="mt-2 font-serif text-4xl text-[#1d2940]">{title}</h1><p className="mt-2 max-w-2xl text-sm leading-7 text-[#667085]">{description}</p></div>{children}</div></DashboardLayout>;
}
