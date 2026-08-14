import { Button } from "@/components/ui/button";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { ArrowRight, ChevronLeft, ChevronRight, List, Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "wouter";

export default function Reader({ novelSlug, chapterSlug }: { novelSlug: string; chapterSlug: string }) {
  const { data: chapter, isLoading } = trpc.catalog.read.useQuery({ novelSlug, chapterSlug });
  const { isAuthenticated } = useAuth();
  const [dark, setDark] = useState(false);
  const [toc, setToc] = useState(false);
  const recordView = trpc.catalog.recordView.useMutation();
  const saveProgress = trpc.library.saveProgress.useMutation();

  useEffect(() => {
    if (!chapter) return;
    recordView.mutate({ novelId: chapter.novelId, chapterId: chapter.chapterId, eventType: "chapter_open" });
    if (isAuthenticated) saveProgress.mutate({ novelId: chapter.novelId, chapterId: chapter.chapterId, characterOffset: 0, progressPercent: 0, isCompleted: false });
  }, [chapter?.chapterId, chapter?.novelId, isAuthenticated]);

  if (isLoading) return <div className="grid min-h-screen place-items-center bg-[#fbf8f2]"><div className="h-96 w-80 animate-pulse rounded-3xl bg-[#e9dfca]" /></div>;
  if (!chapter) return <div className="grid min-h-screen place-items-center bg-[#fbf8f2] text-center" dir="rtl"><div><h1 className="font-serif text-4xl">الفصل غير متاح</h1><Link href="/novels" className="mt-4 inline-block text-[#af7c42]">العودة للمكتبة</Link></div></div>;

  const paragraphs = chapter.content.split(/\n{2,}/).filter(Boolean);
  return <div className={dark ? "min-h-screen bg-[#161c29] text-[#f2eadb]" : "min-h-screen bg-[#fbf8f2] text-[#263550]"} dir="rtl">
    <header className="border-b border-current/10">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 text-sm">
        <Link href={`/novels/${chapter.novelSlug}`} className="inline-flex items-center gap-2 font-semibold hover:text-[#af7c42]"><ArrowRight className="h-4 w-4" />العودة للرواية</Link>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" className="rounded-full" onClick={() => setToc(!toc)} aria-label="قائمة الفصول"><List className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" className="rounded-full" onClick={() => setDark(!dark)} aria-label="تغيير الإضاءة">{dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}</Button>
        </div>
      </div>
    </header>
    <main className="mx-auto max-w-4xl px-5 py-8 md:py-12">
      {toc && <aside className="mb-8 rounded-2xl border border-current/15 p-4"><p className="mb-2 text-xs font-bold text-[#af7c42]">فصول الرواية</p><div className="grid gap-1 sm:grid-cols-2">{chapter.chapters.map(item => <Link key={item.slug} href={`/read/${chapter.novelSlug}/${item.slug}`} className={`rounded-lg px-3 py-2 text-sm ${item.slug === chapter.chapterSlug ? "bg-[#af7c42] text-white" : "hover:bg-current/10"}`}>{item.sortOrder}. {item.title}</Link>)}</div></aside>}
      <div className="mx-auto max-w-2xl">
        <p className="text-center text-sm font-semibold text-[#af7c42]">{chapter.novelTitle}</p>
        <h1 className="mt-3 text-center font-serif text-4xl leading-tight md:text-5xl">{chapter.chapterTitle}</h1>
        <div className="mx-auto mt-5 h-px w-16 bg-[#af7c42]" />
        <article className="mt-12 font-serif text-[1.22rem] leading-[2.35] md:text-[1.35rem]">{paragraphs.map((paragraph, index) => <p key={index} className="mb-8">{paragraph}</p>)}</article>
        <nav className="mt-14 flex items-center justify-between gap-4 border-t border-current/10 pt-7">
          {chapter.previous ? <Link href={`/read/${chapter.novelSlug}/${chapter.previous.slug}`} className="inline-flex items-center gap-2 text-sm font-bold hover:text-[#af7c42]"><ChevronRight className="h-5 w-5" /><span><small className="block font-normal opacity-60">السابق</small>{chapter.previous.title}</span></Link> : <span />}
          {chapter.next ? <Link href={`/read/${chapter.novelSlug}/${chapter.next.slug}`} className="inline-flex items-center gap-2 text-left text-sm font-bold hover:text-[#af7c42]"><span><small className="block font-normal opacity-60">التالي</small>{chapter.next.title}</span><ChevronLeft className="h-5 w-5" /></Link> : <span />}
        </nav>
      </div>
    </main>
  </div>;
}
