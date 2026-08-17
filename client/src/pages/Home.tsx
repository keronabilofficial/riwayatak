import BookCard from "@/components/BookCard";
import PublicLayout from "@/components/PublicLayout";
import { useAuth } from "@/_core/hooks/useAuth";
import { canAccessManagement } from "@/lib/adminAccess";
import AdPlacement from "@/components/AdPlacement";
import SectionHeading from "@/components/SectionHeading";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, BookOpen, Feather, History, Search } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";

export default function Home() {
  const { data, isLoading } = trpc.catalog.home.useQuery();
  const { user } = useAuth();
  const canManageContent = canAccessManagement(user?.role);
  const { data: appearance } = trpc.platform.appearance.useQuery();
  const { data: continueReading } = trpc.library.continueReading.useQuery(undefined, { enabled: Boolean(user) });
  const [query, setQuery] = useState("");
  const [, navigate] = useLocation();
  const featured = data?.featured ?? [];
  const latest = data?.latest ?? [];
  const categories = data?.categories ?? [];
  const submitSearch = (event: React.FormEvent) => { event.preventDefault(); navigate(`/search?q=${encodeURIComponent(query.trim())}`); };

  return <PublicLayout>
    <section className="relative isolate overflow-hidden text-[#f6f1e7]" style={{ backgroundColor: appearance?.primaryColor ?? "#1d2940" }}>
      <div className="absolute inset-0 -z-20 bg-cover bg-center opacity-65" style={{ backgroundImage: `url(${appearance?.heroImageUrl ?? "/manus-storage/riwayatak-hero-library_c40163e2.jpg"})` }} />
      <div className="absolute inset-0 -z-10" style={{ background: `linear-gradient(90deg, ${appearance?.primaryColor ?? "#1d2940"}fa 0%, ${appearance?.primaryColor ?? "#1d2940"}dd 45%, ${appearance?.primaryColor ?? "#1d2940"}66 100%)` }} />
      <div className="container grid min-h-[570px] items-center py-20 md:py-28">
        <div className="max-w-2xl">
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-bold" style={{ borderColor: `${appearance?.accentColor ?? "#d5a85e"}66`, backgroundColor: `${appearance?.accentColor ?? "#d5a85e"}1a`, color: appearance?.accentColor ?? "#ead7ad" }}><Feather className="h-4 w-4" />{appearance?.heroEyebrow ?? "مساحة عربية للحكايات التي تبقى"}</div>
          <h1 className="font-serif text-5xl leading-[1.13] md:text-7xl">{appearance?.heroTitle ?? "حكاية واحدة"}<br /><span style={{ color: appearance?.accentColor ?? "#d5a85e" }}>{appearance?.heroHighlight ?? "قادرة على"}</span> تغيير مساءك.</h1>
          <p className="mt-7 max-w-xl text-lg leading-8 text-[#f6f1e7]/75">{appearance?.heroDescription ?? "اكتشف روايات عربية مختارة، واقرأ فصولها في مساحة مصممة لتترك اللغة تتنفس."}</p>
          <form onSubmit={submitSearch} className="mt-9 flex max-w-lg items-center gap-2 rounded-2xl bg-white p-2 shadow-2xl shadow-black/20">
            <Search className="mr-2 h-5 w-5 text-[#7d8796]" /><Input value={query} onChange={event => setQuery(event.target.value)} placeholder="ابحث عن عنوان أو مؤلف أو وسم..." className="h-11 border-0 bg-transparent text-[#1d2940] shadow-none focus-visible:ring-0" /><Button type="submit" className="h-11 bg-[#af7c42] px-6 text-white hover:bg-[#936536]">بحث</Button>
          </form>
          <div className="mt-8 flex flex-wrap items-center gap-4 text-sm text-[#f6f1e7]/65"><span className="inline-flex items-center gap-2"><BookOpen className="h-4 w-4 text-[#d5a85e]" />قراءة بلا تشتيت</span><span>واجهة عربية أصيلة</span>{continueReading?.[0] ? <Link href={`/read/${continueReading[0].novelSlug}/${continueReading[0].chapterSlug}`} className="inline-flex items-center gap-2 rounded-xl bg-[#d5a85e] px-4 py-2 font-bold text-[#1d2940] transition hover:bg-[#ead7ad]"><BookOpen className="h-4 w-4" />متابعة القراءة<span className="text-xs font-normal opacity-75">{continueReading[0].novelTitle} · {continueReading[0].progressPercent}%</span></Link> : null}</div>
        </div>
      </div>
    </section>

    <section className="container py-18 md:py-24">
      <SectionHeading eyebrow="مختارات المكتبة" title="روايات تستحق أن تبدأ بها" href="/novels" />
      {isLoading ? <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-6">{Array.from({ length: 6 }).map((_, index) => <div key={index} className="aspect-[3/4] animate-pulse rounded-[1.2rem] bg-[#e8dfcf]" />)}</div> : featured.length > 0 ? <div className="grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 lg:grid-cols-6">{featured.map(novel => <BookCard key={novel.id} novel={novel} />)}</div> : <div className="rounded-[1.5rem] border border-dashed border-[#af7c42]/40 bg-[#fbf8f2] p-10 text-center"><BookOpen className="mx-auto h-7 w-7 text-[#af7c42]" /><h3 className="mt-4 font-serif text-2xl">تُرتّب رفوف المكتبة الآن</h3><p className="mx-auto mt-2 max-w-md text-sm leading-7 text-[#667085]">ستظهر هنا الروايات المميزة فور نشرها من لوحة الإدارة.</p></div>}
      <AdPlacement placement="home" />
    </section>

    {user ? <section className="container pb-18 md:pb-24"><div className="rounded-[1.5rem] border border-[#1d2940]/10 bg-[#fbf8f2] p-6 md:p-8"><div className="flex items-center justify-between gap-4"><div className="flex items-center gap-3"><History className="h-5 w-5 text-[#af7c42]" /><div><p className="text-xs font-bold text-[#af7c42]">عودة سريعة</p><h2 className="mt-1 font-serif text-3xl text-[#1d2940]">سجل القراءة</h2></div></div><Link href="/library" className="text-sm font-bold text-[#af7c42] hover:text-[#936536]">عرض مكتبتي</Link></div>{continueReading?.length ? <div className="mt-5 grid gap-3 md:grid-cols-3">{continueReading.slice(0, 3).map(item => <Link key={`${item.novelId}-${item.chapterId}`} href={`/read/${item.novelSlug}/${item.chapterSlug}`} className="group rounded-2xl border border-[#1d2940]/10 bg-white p-4 transition hover:-translate-y-0.5 hover:border-[#af7c42]/50"><strong className="block truncate font-serif text-lg text-[#1d2940] group-hover:text-[#af7c42]">{item.novelTitle}</strong><span className="mt-1 block truncate text-xs text-[#667085]">{item.chapterTitle}</span><div className="mt-3 flex items-center justify-between text-xs text-[#667085]"><span>{item.progressPercent}% مكتمل</span><BookOpen className="h-4 w-4 text-[#af7c42]" /></div></Link>)}</div> : <p className="mt-5 rounded-xl bg-white p-4 text-sm text-[#667085]">سيظهر هنا آخر ما تصفحته بعد بدء قراءة رواية.</p>}</div></section> : null}

    <section className="border-y border-[#1d2940]/10 bg-[#e9dfca]/45 py-18 md:py-24"><div className="container"><SectionHeading eyebrow="دليل القراءة" title="اختر مزاجك الأدبي" href="/categories" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{categories.length ? categories.slice(0, 8).map((category, index) => <Link key={category.id} href={`/categories/${category.slug}`} className="group flex min-h-32 items-end justify-between rounded-2xl border border-[#1d2940]/10 bg-[#f6f1e7] p-5 transition hover:-translate-y-1 hover:border-[#af7c42]/50 hover:shadow-xl hover:shadow-[#1d2940]/5"><span><span className="mb-2 block text-xs font-bold text-[#af7c42]">{String(index + 1).padStart(2, "0")}</span><strong className="font-serif text-2xl">{category.name}</strong><span className="mt-1 block text-xs text-[#667085]">{category.description || "اكتشف عوالم جديدة"}</span></span><ArrowLeft className="h-5 w-5 text-[#af7c42]" /></Link>) : <div className="col-span-full rounded-2xl bg-[#f6f1e7] p-7 text-sm text-[#667085]">يمكن إضافة التصنيفات وإدارتها من لوحة التحكم.</div>}</div>
    </div></section>

    <section className="container py-18 md:py-24"><SectionHeading eyebrow="أضيف حديثًا" title="واصل من حيث تبدأ الحكاية" href="/novels" />
      {latest.length > 0 ? <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">{latest.slice(0, 6).map(novel => <BookCard key={novel.id} novel={novel} featured />)}</div> : canManageContent ? <div className="rounded-[1.5rem] bg-[#1d2940] p-9 text-[#f6f1e7]"><p className="text-sm text-[#d5a85e]">إدارة المحتوى المركزية</p><h3 className="mt-2 font-serif text-3xl">ابنِ مكتبتك روايةً وراء رواية.</h3><p className="mt-3 max-w-xl text-sm leading-7 text-[#f6f1e7]/65">أنشئ المؤلفين والروايات والفصول، ثم راجع المحتوى وانشره ضمن دورة عمل واضحة.</p><Link href="/admin"><Button className="mt-6 bg-[#d5a85e] text-[#1d2940] hover:bg-[#ead7ad]">الانتقال إلى الإدارة</Button></Link></div> : <div className="rounded-[1.5rem] border border-dashed border-[#af7c42]/40 bg-[#fbf8f2] p-9 text-center"><p className="font-serif text-3xl text-[#1d2940]">ستبدأ الحكايات من هنا.</p><p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-[#667085]">لا توجد روايات منشورة حاليًا. استكشف المكتبة أو عد لاحقًا لاكتشاف الإصدارات الجديدة.</p><Link href="/novels"><Button className="mt-6 bg-[#af7c42] text-white hover:bg-[#936536]">استكشاف الروايات</Button></Link></div>}
    </section>
  </PublicLayout>;
}
