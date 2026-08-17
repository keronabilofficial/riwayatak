import AdminShell from "@/components/AdminShell";
import { Button } from "@/components/ui/button";
import { BookOpen, FileText, Link2, Palette, Settings2, Users } from "lucide-react";
import { useLocation } from "wouter";

const pageGroups = [
  { title: "الواجهة الرئيسية", description: "تحرير اسم المنصة والشعار والنصوص والصورة والألوان من إعدادات المظهر.", icon: Palette, path: "/admin/system/appearance", action: "فتح إعدادات المظهر" },
  { title: "الباقات والاشتراكات", description: "تحرير الأسعار والحدود ومدد الباقات وخيارات الشراء الجديدة.", icon: Settings2, path: "/admin/system/plans", action: "فتح إدارة الباقات" },
  { title: "الوثائق القانونية", description: "تحرير الخصوصية والشروط وسياسة المحتوى وحقوق النشر وتواصل معنا بتنسيق منسق.", icon: FileText, path: "/admin/system/legal", action: "فتح محرر الوثائق" },
  { title: "المحتوى الأدبي", description: "إدارة المؤلفين والروايات والفصول والتصنيفات والوسائط من أدوات المحتوى المتخصصة.", icon: BookOpen, path: "/admin/novels", action: "فتح إدارة المحتوى" },
  { title: "روابط التواصل", description: "إضافة روابط التواصل الرسمية وتعديلها وتفعيلها وترتيبها.", icon: Link2, path: "/admin/system/social", action: "فتح روابط التواصل" },
  { title: "المستخدمون والأدوار", description: "إدارة الحسابات والأدوار وحالة الوصول من لوحة المستخدمين.", icon: Users, path: "/admin/system/users", action: "فتح إدارة المستخدمين" },
];

export default function AdminPageContent() {
  const [, setLocation] = useLocation();
  return <AdminShell title="إدارة صفحات المنصة" description="مركز موحد للوصول إلى محررات الصفحات والإعدادات دون تعديل البيانات الديناميكية بطريقة غير آمنة." requireAdmin><div className="grid gap-5 md:grid-cols-2" dir="rtl">{pageGroups.map(group => <article key={group.path} className="rounded-2xl border border-border bg-card p-6 text-card-foreground"><div className="flex items-start gap-4"><div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><group.icon className="h-5 w-5" /></div><div><h2 className="font-serif text-2xl">{group.title}</h2><p className="mt-2 text-sm leading-7 text-muted-foreground">{group.description}</p><Button type="button" variant="outline" className="mt-4" onClick={() => setLocation(group.path)}>{group.action}</Button></div></div></article>)}</div><div className="mt-6 rounded-2xl border border-primary/20 bg-primary/5 p-5 text-sm leading-7 text-muted-foreground">تُحرر الصفحات العامة الثابتة عبر إعدادات المظهر والوثائق، بينما تُدار الروايات والفصول والمؤلفون والتصنيفات والوسائط والمستخدمون من سجلاتها المتخصصة؛ هذا الفصل يحمي البيانات والعلاقات ولا يسمح بمحرر نصي عام يفسد المحتوى الديناميكي.</div></AdminShell>;
}
