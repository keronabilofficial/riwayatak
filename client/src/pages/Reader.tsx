import { Button } from "@/components/ui/button";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useTheme } from "@/contexts/ThemeContext";
import AudioPlayerMock from "@/components/AudioPlayerMock";
import ChapterComments from "@/components/ChapterComments";
import { parseReaderFontScale, readerFontScaleKey } from "@/lib/readerPreferences";
import { ArrowRight, BookmarkPlus, Check, ChevronLeft, ChevronRight, Headphones, List, LockKeyhole, Minus, Moon, Plus, Quote, Settings2, Sun, Trash2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "wouter";

export default function Reader({ novelSlug, chapterSlug }: { novelSlug: string; chapterSlug: string }) {
  const { data: chapter, isLoading } = trpc.catalog.read.useQuery({ novelSlug, chapterSlug });
  const { isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [, navigate] = useLocation();
  const dark = theme === "dark";
  const [toc, setToc] = useState(false);
  const [readingSettings, setReadingSettings] = useState(false);
  const [fontScale, setFontScale] = useState(() => parseReaderFontScale(window.localStorage.getItem(readerFontScaleKey)));
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [selectedQuote, setSelectedQuote] = useState<{ text: string } | null>(null);
  const articleRef = useRef<HTMLElement | null>(null);
  const lastProgressRef = useRef(-1);
  const { data: quotes } = trpc.library.quotes.useQuery({ chapterId: chapter?.chapterId }, { enabled: isAuthenticated && Boolean(chapter?.chapterId) });
  const { data: syncedProgress, isLoading: isProgressLoading } = trpc.library.progress.useQuery({ novelId: chapter?.novelId ?? 0 }, { enabled: isAuthenticated && Boolean(chapter?.novelId) });
  const utils = trpc.useUtils();
  const saveQuote = trpc.library.saveQuote.useMutation({ onSuccess: () => { setSelectedQuote(null); void utils.library.quotes.invalidate({ chapterId: chapter?.chapterId }); } });
  const deleteQuote = trpc.library.deleteQuote.useMutation({ onSuccess: () => void utils.library.quotes.invalidate({ chapterId: chapter?.chapterId }) });
  const recordView = trpc.catalog.recordView.useMutation();
  const saveProgress = trpc.library.saveProgress.useMutation();
  const recordReadingTime = trpc.library.recordReadingTime.useMutation();
  const listenChapter = trpc.subscriptions.listenChapter.useMutation({ onSuccess: result => setAudioUrl(result.audioUrl) });
  const handleTextSelection = () => {
    const selection = window.getSelection();
    const text = selection?.toString().trim();
    if (!text || !articleRef.current || !selection?.rangeCount) return;
    const range = selection.getRangeAt(0);
    if (!articleRef.current.contains(range.commonAncestorContainer)) return;
    setSelectedQuote({ text: text.slice(0, 2000) });
  };

  useEffect(() => {
    window.localStorage.setItem(readerFontScaleKey, String(fontScale));
  }, [fontScale]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.tagName === "INPUT" || target?.tagName === "TEXTAREA" || target?.isContentEditable) return;
      if (event.key === "ArrowLeft" && chapter?.next) {
        event.preventDefault();
        navigate(`/read/${chapter.novelSlug}/${chapter.next.slug}`);
      } else if (event.key === "ArrowRight" && chapter?.previous) {
        event.preventDefault();
        navigate(`/read/${chapter.novelSlug}/${chapter.previous.slug}`);
      } else if (event.key === "+" || event.key === "=") {
        event.preventDefault();
        setFontScale(current => Math.min(1.5, Number((current + 0.08).toFixed(2))));
      } else if (event.key === "-" || event.key === "_") {
        event.preventDefault();
        setFontScale(current => Math.max(1, Number((current - 0.08).toFixed(2))));
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [chapter?.novelSlug, chapter?.next?.slug, chapter?.previous?.slug, navigate]);

  useEffect(() => {
    if (!chapter || !chapter.access.allowed || isProgressLoading) return;
    recordView.mutate({ novelId: chapter.novelId, chapterId: chapter.chapterId, eventType: "chapter_open" });
    if (isAuthenticated && !syncedProgress) saveProgress.mutate({ novelId: chapter.novelId, chapterId: chapter.chapterId, characterOffset: 0, progressPercent: 0, isCompleted: false });
    if (isAuthenticated && syncedProgress?.chapterId === chapter.chapterId && syncedProgress.progressPercent > 0) {
      lastProgressRef.current = syncedProgress.progressPercent;
      window.requestAnimationFrame(() => window.scrollTo({ top: Math.max(0, (document.documentElement.scrollHeight - window.innerHeight) * (syncedProgress.progressPercent / 100)), behavior: "instant" as ScrollBehavior }));
    }
  }, [chapter?.chapterId, chapter?.novelId, chapter?.access.allowed, isAuthenticated, isProgressLoading, syncedProgress?.chapterId, syncedProgress?.progressPercent]);

  useEffect(() => {
    if (!chapter || !chapter.access.allowed || !isAuthenticated) return;
    let frame = 0;
    const persistPosition = () => {
      frame = 0;
      const total = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const progressPercent = Math.max(0, Math.min(100, Math.round((window.scrollY / total) * 100)));
      if (Math.abs(progressPercent - lastProgressRef.current) < 4 && progressPercent !== 100) return;
      lastProgressRef.current = progressPercent;
      saveProgress.mutate({ novelId: chapter.novelId, chapterId: chapter.chapterId, characterOffset: Math.round((chapter.content.length * progressPercent) / 100), progressPercent, isCompleted: progressPercent >= 100 });
    };
    const onScroll = () => { if (!frame) frame = window.requestAnimationFrame(persistPosition); };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { if (frame) window.cancelAnimationFrame(frame); window.removeEventListener("scroll", onScroll); };
  }, [chapter?.chapterId, chapter?.novelId, chapter?.content, chapter?.access.allowed, isAuthenticated]);

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
          <Button variant="ghost" size="icon" className="rounded-full" onClick={() => setReadingSettings(current => !current)} aria-label="إعدادات القراءة"><Settings2 className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" className="rounded-full" onClick={toggleTheme} aria-label={dark ? "تفعيل الوضع النهاري" : "تفعيل الوضع الليلي"}>{dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}</Button>
        </div>
      </div>
    </header>
    <main className="mx-auto max-w-4xl px-5 py-8 md:py-12">
      {toc && <aside className="mb-8 rounded-2xl border border-current/15 p-4"><p className="mb-2 text-xs font-bold text-[#af7c42]">فصول الرواية</p><div className="grid gap-1 sm:grid-cols-2">{chapter.chapters.map(item => <Link key={item.slug} href={`/read/${chapter.novelSlug}/${item.slug}`} className={`rounded-lg px-3 py-2 text-sm ${item.slug === chapter.chapterSlug ? "bg-[#af7c42] text-white" : "hover:bg-current/10"}`}>{item.sortOrder}. {item.title}</Link>)}</div></aside>}
      {readingSettings && <aside className="mb-8 rounded-2xl border border-current/15 bg-current/5 p-4" aria-label="إعدادات القراءة"><div className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-xs font-bold text-[#af7c42]">إعدادات القراءة</p><p className="mt-1 text-xs opacity-70">تُحفظ اختياراتك تلقائيًا على هذا الجهاز.</p></div><div className="flex items-center gap-2"><span className="text-xs opacity-70">حجم الخط</span><Button type="button" variant="outline" size="icon" className="h-8 w-8" aria-label="تصغير الخط" onClick={() => setFontScale(current => Math.max(1, Number((current - 0.08).toFixed(2))))}><Minus className="h-4 w-4" /></Button><span className="min-w-12 text-center text-sm font-bold" dir="ltr">{Math.round(fontScale / 1.22 * 100)}%</span><Button type="button" variant="outline" size="icon" className="h-8 w-8" aria-label="تكبير الخط" onClick={() => setFontScale(current => Math.min(1.5, Number((current + 0.08).toFixed(2))))}><Plus className="h-4 w-4" /></Button><Button type="button" variant="outline" size="sm" onClick={toggleTheme}>{dark ? "الوضع النهاري" : "الوضع الليلي"}</Button></div></div></aside>}
      <div className="mx-auto max-w-2xl">
        <p className="text-center text-sm font-semibold text-[#af7c42]">{chapter.novelTitle}</p>
        <h1 className="mt-3 text-center font-serif text-4xl leading-tight md:text-5xl">{chapter.chapterTitle}</h1>
        <div className="mx-auto mt-5 h-px w-16 bg-[#af7c42]" />
        {!chapter.access.allowed ? <section className="mx-auto mt-10 max-w-xl rounded-3xl border border-[#af7c42]/30 bg-card p-7 text-center shadow-sm"><LockKeyhole className="mx-auto h-7 w-7 text-[#af7c42]" /><h2 className="mt-4 font-serif text-2xl">هذا الفصل متاح للمشتركين</h2><p className="mt-3 text-sm leading-7 text-muted-foreground">{chapter.access.reason}</p><Link href="/plans" className="mt-5 inline-flex rounded-xl bg-[#af7c42] px-5 py-3 text-sm font-bold text-white">عرض الباقات</Link></section> : <>
          {chapter.hasAudio ? <section className="mx-auto mt-7 max-w-xl rounded-2xl border border-current/10 bg-current/5 p-4"><div className="flex items-center gap-2 text-sm font-bold"><Headphones className="h-4 w-4 text-[#af7c42]" />استمع إلى الفصل</div>{audioUrl ? <audio controls preload="metadata" src={audioUrl} className="mt-3 w-full" /> : <button type="button" onClick={() => listenChapter.mutate({ chapterId: chapter.chapterId })} disabled={listenChapter.isPending} className="mt-3 rounded-lg bg-[#af7c42] px-4 py-2 text-sm font-bold text-white disabled:opacity-60">{listenChapter.isPending ? "جارٍ التحقق..." : "بدء الاستماع"}</button>}{listenChapter.error && <p className="mt-3 text-sm text-destructive">تعذر التحقق من صلاحية الاستماع الآن. حاول مرة أخرى أو راجع حالة اشتراكك.</p>}</section> : <AudioPlayerMock novelTitle={chapter.novelTitle} chapterTitle={chapter.chapterTitle} currentChapterSlug={chapter.chapterSlug} chapters={chapter.chapters} />}
          {selectedQuote ? <div className="mt-8 flex flex-wrap items-center gap-3 rounded-2xl border border-[#af7c42]/35 bg-[#af7c42]/10 px-4 py-3 text-sm" role="status"><Quote className="h-4 w-4 shrink-0 text-[#af7c42]" /><p className="min-w-0 flex-1 truncate">«{selectedQuote.text}»</p><Button type="button" size="sm" className="gap-1 bg-[#af7c42] text-white hover:bg-[#936536]" disabled={saveQuote.isPending} onClick={() => saveQuote.mutate({ novelId: chapter.novelId, chapterId: chapter.chapterId, selectedText: selectedQuote.text })}>{saveQuote.isPending ? "جارٍ الحفظ…" : <><BookmarkPlus className="h-4 w-4" />حفظ الاقتباس</>}</Button><Button type="button" variant="ghost" size="icon" className="h-8 w-8" aria-label="إلغاء تحديد الاقتباس" onClick={() => setSelectedQuote(null)}><X className="h-4 w-4" /></Button></div> : null}<article ref={articleRef} onMouseUp={handleTextSelection} onTouchEnd={handleTextSelection} className="mt-12 select-text font-serif leading-[2.35]" style={{ fontSize: `${fontScale}rem` }}>{paragraphs.map((paragraph, index) => <p key={index} className="mb-8">{paragraph}</p>)}</article>{isAuthenticated ? <section className="mt-12 rounded-2xl border border-current/10 bg-current/5 p-5"><div className="flex items-center gap-2"><Quote className="h-4 w-4 text-[#af7c42]" /><h2 className="font-serif text-xl">اقتباساتك المحفوظة</h2><span className="text-xs opacity-60">({quotes?.length ?? 0})</span></div>{quotes?.length ? <div className="mt-4 grid gap-3">{quotes.map(item => <div key={item.id} className="rounded-xl border border-current/10 bg-background/60 p-4"><blockquote className="border-r-2 border-[#af7c42] pr-3 text-sm leading-7">«{item.selectedText}»</blockquote><div className="mt-3 flex items-center justify-between gap-2"><small className="opacity-60">حُفظ في {new Date(item.createdAt).toLocaleDateString("ar-EG")}</small><Button type="button" variant="ghost" size="sm" className="h-8 text-destructive" disabled={deleteQuote.isPending} onClick={() => deleteQuote.mutate({ id: item.id })}><Trash2 className="ml-1 h-3.5 w-3.5" />حذف</Button></div></div>)}</div> : <p className="mt-3 text-sm leading-7 opacity-65">حدد جملة من النص ثم اختر «حفظ الاقتباس» لتظهر هنا وتظل خاصة بحسابك.</p>}</section> : null}<ChapterComments chapterId={chapter.chapterId} />
        </>}
        <nav className="mt-14 flex items-center justify-between gap-4 border-t border-current/10 pt-7">
          {chapter.previous ? <Link href={`/read/${chapter.novelSlug}/${chapter.previous.slug}`} className="inline-flex items-center gap-2 text-sm font-bold hover:text-[#af7c42]"><ChevronRight className="h-5 w-5" /><span><small className="block font-normal opacity-60">السابق</small>{chapter.previous.title}</span></Link> : <span />}
          {chapter.next ? <Link href={`/read/${chapter.novelSlug}/${chapter.next.slug}`} className="inline-flex items-center gap-2 text-left text-sm font-bold hover:text-[#af7c42]"><span><small className="block font-normal opacity-60">التالي</small>{chapter.next.title}</span><ChevronLeft className="h-5 w-5" /></Link> : <span />}
        </nav>
      </div>
    </main>
  </div>;
}
