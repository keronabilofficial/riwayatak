import { Button } from "@/components/ui/button";
import { ChevronDown, FastForward, Headphones, ListMusic, Pause, Play, Rewind, SlidersHorizontal, Volume1, Volume2, VolumeX } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type MockChapter = { slug: string; title: string; sortOrder?: number };

type AudioPlayerMockProps = {
  novelTitle: string;
  chapterTitle: string;
  chapters?: MockChapter[];
  currentChapterSlug?: string;
};

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainder = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${remainder}`;
}

export default function AudioPlayerMock({ novelTitle, chapterTitle, chapters = [], currentChapterSlug }: AudioPlayerMockProps) {
  const duration = 18 * 60 + 42;
  const [playing, setPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [speed, setSpeed] = useState("1");
  const [volume, setVolume] = useState(75);
  const [muted, setMuted] = useState(false);
  const [selectedChapter, setSelectedChapter] = useState(currentChapterSlug ?? "current");

  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => {
      setPosition(current => {
        const next = Math.min(duration, current + Number(speed));
        if (next >= duration) setPlaying(false);
        return next;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [playing, speed]);

  const progress = useMemo(() => (position / duration) * 100, [position]);
  const seek = (amount: number) => setPosition(current => Math.max(0, Math.min(duration, current + amount)));
  const volumeValue = muted ? 0 : volume;

  return <section className="mt-7 overflow-hidden rounded-3xl border border-[#af7c42]/25 bg-gradient-to-br from-[#1d2940] to-[#263754] p-5 text-white shadow-lg" aria-label="مشغل صوتي تجريبي">
    <div className="flex items-start justify-between gap-4">
      <div className="flex min-w-0 items-start gap-3"><div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#af7c42]/20 text-[#e1b15a]"><Headphones className="h-5 w-5" /></div><div className="min-w-0"><span className="inline-flex items-center gap-1 rounded-full border border-[#e1b15a]/40 px-2 py-0.5 text-[10px] font-bold text-[#e1b15a]"><SlidersHorizontal className="h-3 w-3" />محاكاة تصميمية</span><h2 className="mt-2 truncate font-serif text-lg">{chapterTitle}</h2><p className="mt-1 truncate text-xs text-white/65">{novelTitle} · لا يوجد تسجيل صوتي فعلي بعد</p></div></div><Volume2 className="mt-1 h-4 w-4 text-white/55" aria-hidden="true" /></div>
    {chapters.length > 0 ? <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-3"><label className="flex items-center gap-2 text-xs font-bold text-white/80"><ListMusic className="h-4 w-4 text-[#e1b15a]" />الفصول المتاحة للمحاكاة</label><div className="relative mt-2"><select aria-label="اختيار فصل للمشغل المحاكى" value={selectedChapter} onChange={event => { setSelectedChapter(event.target.value); setPosition(0); setPlaying(false); }} className="w-full appearance-none rounded-xl border border-white/15 bg-[#1d2940] px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-[#e1b15a]/60">{chapters.map(item => <option key={item.slug} value={item.slug}>{item.sortOrder ? `${item.sortOrder}. ` : ""}{item.title}</option>)}</select><ChevronDown className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-white/60" /></div><p className="mt-2 text-[11px] text-white/50">اختيار الفصل يغيّر حالة المحاكاة فقط ولا يفتح تسجيلًا حقيقيًا.</p></div> : null}
    <div className="mt-6"><input aria-label="موضع التشغيل التجريبي" type="range" min="0" max={duration} value={position} onChange={event => setPosition(Number(event.target.value))} className="w-full accent-[#e1b15a]" /><div className="mt-1 flex justify-between text-[11px] text-white/55" dir="ltr"><span>{formatTime(position)}</span><span>{formatTime(duration)}</span></div></div>
    <div className="mt-4 flex items-center justify-center gap-2"><Button variant="ghost" size="icon" aria-label="تقديم 30 ثانية" className="text-white/75 hover:bg-white/10 hover:text-white" onClick={() => seek(30)}><FastForward className="h-4 w-4" /></Button><Button variant="ghost" size="icon" aria-label="إرجاع 15 ثانية" className="text-white/75 hover:bg-white/10 hover:text-white" onClick={() => seek(-15)}><Rewind className="h-4 w-4" /></Button><Button size="icon" aria-label={playing ? "إيقاف التشغيل التجريبي" : "تشغيل المحاكاة"} className="h-12 w-12 rounded-full bg-[#e1b15a] text-[#1d2940] hover:bg-[#f0c878]" onClick={() => setPlaying(current => !current)}>{playing ? <Pause className="h-5 w-5" /> : <Play className="mr-[-2px] h-5 w-5" />}</Button></div>
    <div className="mt-5 flex items-center gap-3 border-t border-white/10 pt-4"><Button type="button" variant="ghost" size="icon" aria-label={muted ? "إلغاء كتم الصوت" : "كتم الصوت"} className="shrink-0 text-white/75 hover:bg-white/10 hover:text-white" onClick={() => setMuted(current => !current)}>{muted || volumeValue === 0 ? <VolumeX className="h-4 w-4" /> : volumeValue < 50 ? <Volume1 className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}</Button><input aria-label="مستوى الصوت التجريبي" type="range" min="0" max="100" value={volumeValue} onChange={event => { setVolume(Number(event.target.value)); setMuted(false); }} className="min-w-0 flex-1 accent-[#e1b15a]" /><span className="w-9 text-left text-[11px] text-white/55" dir="ltr">{volumeValue}%</span><label className="flex items-center gap-2 text-xs text-white/70">السرعة<select aria-label="سرعة التشغيل التجريبية" value={speed} onChange={event => setSpeed(event.target.value)} className="rounded-lg border border-white/15 bg-white/10 px-2 py-1 text-xs text-white outline-none"><option value="0.75">0.75x</option><option value="1">1x</option><option value="1.25">1.25x</option><option value="1.5">1.5x</option><option value="2">2x</option></select></label></div><p className="mt-3 text-[11px] leading-5 text-white/55">التفاعل هنا تجريبي فقط، ولن يستهلك من حدود الاستماع.</p><div className="sr-only" aria-live="polite">تقدم المحاكاة {Math.round(progress)} بالمئة</div>
  </section>;
}
