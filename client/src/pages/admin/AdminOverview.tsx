import AdminShell from "@/components/AdminShell";
import AdminStatCard from "@/components/AdminStatCard";
import { trpc } from "@/lib/trpc";
import { Activity, BookOpen, Eye, Users } from "lucide-react";

const activityLabels: Record<string, string> = {
  "author.created": "أُضيف مؤلف", "author.updated": "حُدّث ملف مؤلف", "author.archived": "أُرشف مؤلف",
  "novel.created": "أُنشئت رواية", "novel.updated": "حُدّثت رواية", "novel.archived": "أُرشفت رواية",
  "chapter.created": "أُضيف فصل", "chapter.updated": "حُدّث فصل", "chapter.archived": "أُرشف فصل",
  "chapter.reordered": "أُعيد ترتيب الفصول", "novel.taxonomy.updated": "حُدّث تصنيف الرواية", "user.access.updated": "حُدّثت صلاحيات مستخدم",
};

export default function AdminOverview() {
  const { data, isLoading } = trpc.admin.dashboard.useQuery();
  return <AdminShell title="نظرة عامة" description="تابع نبض المكتبة والمحتوى المنشور من مكان واحد.">
    {isLoading ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-40 animate-pulse rounded-2xl bg-[#e9dfca]" />)}</div> : <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AdminStatCard label="الروايات" value={data?.novels ?? 0} icon={BookOpen} />
        <AdminStatCard label="المؤلفون" value={data?.authors ?? 0} icon={Users} tone="gold" />
        <AdminStatCard label="الفصول" value={data?.chapters ?? 0} icon={Activity} tone="sage" />
        <AdminStatCard label="المستخدمون" value={data?.users ?? 0} icon={Eye} tone="rose" />
      </div>
      <section className="mt-8 rounded-2xl border border-[#1d2940]/10 bg-white p-6">
        <div className="flex items-center justify-between"><h2 className="font-serif text-2xl">النشاط الأخير</h2><span className="text-xs text-[#667085]">يُسجل على الخادم</span></div>
        <div className="mt-4 divide-y divide-[#1d2940]/8">{data?.recentActivity?.length ? data.recentActivity.map(item => <div key={item.id} className="flex items-center justify-between gap-4 py-4"><span className="text-sm font-semibold">{activityLabels[item.action] || item.action}</span><time className="text-xs text-[#667085]">{new Date(item.createdAt).toLocaleString("ar")}</time></div>) : <p className="py-8 text-center text-sm text-[#667085]">سيظهر هنا تاريخ النشر والتعديل والأرشفة بمجرد بدء إضافة المحتوى.</p>}</div>
      </section>
    </>}
  </AdminShell>;
}

