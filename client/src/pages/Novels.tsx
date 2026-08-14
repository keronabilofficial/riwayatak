import BookCard from "@/components/BookCard";
import PublicLayout from "@/components/PublicLayout";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { Loader2, Search } from "lucide-react";
import { useState } from "react";
import { useRoute } from "wouter";

export default function Novels() {
  const [, routeParams] = useRoute("/categories/:slug");
  const categorySlug = routeParams?.slug;
  const [query, setQuery] = useState("");
  const { data, isLoading } = trpc.catalog.listNovels.useQuery({ query: query || undefined, categorySlug, limit: 36 });
  return <PublicLayout><section className="container py-14 md:py-20"><p className="text-xs font-bold tracking-[.18em] text-[#af7c42]">{categorySlug ? "تصنيف أدبي" : "المكتبة"}</p><h1 className="mt-2 font-serif text-5xl">{categorySlug ? "روايات التصنيف" : "كل الروايات"}</h1><p className="mt-4 max-w-2xl leading-8 text-[#667085]">تصفح الأعمال المنشورة، أو ابحث بعنوان الرواية واسم المؤلف والتصنيف والوسم.</p><div className="mt-9 flex max-w-xl items-center rounded-2xl border border-[#1d2940]/15 bg-white px-4"><Search className="h-5 w-5 text-[#af7c42]"/><Input value={query} onChange={event => setQuery(event.target.value)} placeholder="ابحث في المكتبة..." className="h-14 border-0 bg-transparent shadow-none focus-visible:ring-0" /></div></section><section className="container pb-24">{isLoading ? <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-6">{Array.from({length: 12}).map((_, index)=><div key={index} className="aspect-[3/4] animate-pulse rounded-2xl bg-[#e9dfca]" />)}</div> : data?.length ? <div className="grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 lg:grid-cols-6">{data.map(novel=><BookCard key={novel.id} novel={novel} />)}</div> : <div className="rounded-2xl border border-dashed border-[#af7c42]/45 bg-[#fbf8f2] py-16 text-center"><Loader2 className="mx-auto h-6 w-6 text-[#af7c42]"/><h2 className="mt-4 font-serif text-2xl">لا توجد نتائج بعد</h2><p className="mt-2 text-sm text-[#667085]">جرّب عبارة بحث مختلفة أو عد إلى المكتبة لاحقًا.</p></div>}</section></PublicLayout>;
}
