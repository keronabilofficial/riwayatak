import { Button } from "@/components/ui/button";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useTheme } from "@/contexts/ThemeContext";
import AudioPlayerMock from "@/components/AudioPlayerMock";
import { ArrowRight, ChevronLeft, ChevronRight, Headphones, List, LockKeyhole, Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "wouter";

export default function Reader({ novelSlug, chapterSlug }: { novelSlug: string; chapterSlug: string }) {
  const { data: chapter, isLoading } = trpc.catalog.read.useQuery({ novelSlug, chapterSlug });
  const { isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const dark = theme === "dark";
  const [toc, setToc] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const recordView = trpc.catalog.recordView.useMutation();
  const saveProgress = trpc.library.saveProgress.useMutation();
  const recordReadingTime = trpc.library.recordReadingTime.useMutation();
  const listenChapter = trpc.subscriptions.listenChapter.useMutation({ onSuccess: result => setAudioUrl(result.audioUrl) });

  useEffect(() => {
    if (!chapter || !chapter.access.allowed) return;
    recordView.mutate({ novelId: chapter.novelId, chapterId: chapter.chapterId, eventType: "chapter_open" });
    if (isAuthenticated) saveProgress.mutate({ novelId: chapter.novelId, chapterId: chapter.chapterId, characterOffset: 0, progressPercent: 0, isCompleted: false });
  }, [chapter?.chapterId, chapter?.novelId, isAuthenticated]);

  useEffect(() => {
    if (!chapter || !chapter.access.allowed || !isAuthenticated) return;
    const startedAt = Date.now();
    const interval = window.setInterval(() => recordReadingTime.mutate({ novelId: chapter.novelId, seconds: 30 }), 30000);
    return () => {
      const elapsed = Math.floor((Date.now() - startedAt) / 1000);
      if (elapsed >= 5) recordReadingTime.mutate({ novelId: chapter.novelId, seconds: Math.min(300, elapsed) });
      window.clearInterval(interval);
    };
  }, [chapter?.chapterId, chapter?.novelId, chapter?.access.allowed, isAuthenticated]);

  if (isLoading) return <div className="grid min-h-screen place-items-center bg-background"><div className="h-96 w-80 animate-pulse rounded-3xl bg-muted" /></div>;
  if (!chapter) return <div className="grid min-h-screen place-items-center bg-background text-foreground text-center" dir="rtl"><div><h1 className="font-serif text-4xl">الفصل غير متاح</h1><Link href="/novels" className="mt-4 inline-block text-[#af7c42]">العودة للمكتبة</Link></div></div>;

  const paragraphs = chapter.content.split(/\n{2,}/).filter(Boolean);
  return <div className="min-h-screen bg-background text-foreground" dir="rtl">
    <header className="border-b border-current/10">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 text-sm">
        <Link href={`/novels/${chapter.novelSlug}`} className="inline-flex items-center gap-2 font-semibold hover:text-[#af7c42]"><ArrowRight className="h-4 w-4" />العودة للرواية</Link>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" className="rounded-full" onClick={() => setToc(!toc)} aria-label="قائمة الفصول"><List className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" className="rounded-full" onClick={toggleTheme} aria-label="تغيير الإضاءة">{dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}</Button>
        </div>
      </div>
    </header>
    <main className="mx-auto max-w-4xl px-5 py-8 md:py-12">
      {toc && <aside className="mb-8 rounded-2xl border border-current/15 p-4"><p className="mb-2 text-xs font-bold text-[#af7c42]">فصول الرواية</p><div className="grid gap-1 sm:grid-cols-2">{chapter.chapters.map(item => <Link key={item.slug} href={`/read/${chapter.novelSlug}/${item.slug}`} className={`rounded-lg px-3 py-2 text-sm ${item.slug === chapter.chapterSlug ? "bg-[#af7c42] text-white" : "hover:bg-current/10"}`}>{item.sortOrder}. {item.title}</Link>)}</div></aside>}
      <div className="mx-auto max-w-2xl">
        <p className="text-center text-sm font-semibold text-[#af7c42]">{chapter.novelTitle}</p>
        <h1 className="mt-3 text-center font-serif text-4xl leading-tight md:text-5xl">{chapter.chapterTitle}</h1>
        <div className="mx-auto mt-5 h-px w-16 bg-[#af7c42]" />
        {!chapter.access.allowed ? <section className="mx-auto mt-10 max-w-xl rounded-3xl border border-[#af7c42]/30 bg-card p-7 text-center shadow-sm"><LockKeyhole className="mx-auto h-7 w-7 text-[#af7c42]" /><h2 className="mt-4 font-serif text-2xl">هذا الفصل متاح للمشتركين</h2><p className="mt-3 text-sm leading-7 text-muted-foreground">{chapter.access.reason}</p><Link href="/plans" className="mt-5 inline-flex rounded-xl bg-[#af7c42] px-5 py-3 text-sm font-bold text-white">عرض الباقات</Link></section> : <>
          {chapter.hasAudio ? <section className="mx-auto mt-7 max-w-xl rounded-2xl border border-current/10 bg-current/5 p-4"><div className="flex items-center gap-2 text-sm font-bold"><Headphones className="h-4 w-4 text-[#af7c42]" />استمع إلى الفصل</div>{audioUrl ? <audio controls preload="metadata" src={audioUrl} className="mt-3 w-full" /> : <button type="button" onClick={() => listenChapter.mutate({ chapterId: chapter.chapterId })} disabled={listenChapter.isPending} className="mt-3 rounded-lg bg-[#af7c42] px-4 py-2 text-sm font-bold text-white disabled:opacity-60">{listenChapter.isPending ? "جارٍ التحقق..." : "بدء الاستماع"}</button>}{listenChapter.error && <p className="mt-3 text-sm text-destructive">تعذر التحقق من صلاحية الاستماع الآن. حاول مرة أخرى أو راجع حالة اشتراكك.</p>}</section> : <AudioPlayerMock novelTitle={chapter.novelTitle} chapterTitle={chapter.chapterTitle} />}
          <article className="mt-12 font-serif text-[1.22rem] leading-[2.35] md:text-[1.35rem]">{paragraphs.map((paragraph, index) => <p key={index} className="mb-8">{paragraph}</p>)}</article>
        </>}
        <nav className="mt-14 flex items-center justify-between gap-4 border-t border-current/10 pt-7">
          {chapter.previous ? <Link href={`/read/${chapter.novelSlug}/${chapter.previous.slug}`} className="inline-flex items-center gap-2 text-sm font-bold hover:text-[#af7c42]"><ChevronRight className="h-5 w-5" /><span><small className="block font-normal opacity-60">السابق</small>{chapter.previous.title}</span></Link> : <span />}
          {chapter.next ? <Link href={`/read/${chapter.novelSlug}/${chapter.next.slug}`} className="inline-flex items-center gap-2 text-left text-sm font-bold hover:text-[#af7c42]"><span><small className="block font-normal opacity-60">التالي</small>{chapter.next.title}</span><ChevronLeft className="h-5 w-5" /></Link> : <span />}
        </nav>
      </div>
    </main>
  </div>;
}
