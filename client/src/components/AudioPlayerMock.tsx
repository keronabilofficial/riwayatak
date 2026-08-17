import { Button } from "@/components/ui/button";
import { FastForward, Headphones, Pause, Play, Rewind, SlidersHorizontal, Volume2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type AudioPlayerMockProps = {
  novelTitle: string;
  chapterTitle: string;
};

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainder = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${remainder}`;
}

export default function AudioPlayerMock({ novelTitle, chapterTitle }: AudioPlayerMockProps) {
  const duration = 18 * 60 + 42;
  const [playing, setPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [speed, setSpeed] = useState("1");

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

  return <section className="mt-7 overflow-hidden rounded-3xl border border-[#af7c42]/25 bg-gradient-to-br from-[#1d2940] to-[#263754] p-5 text-white shadow-lg" aria-label="مشغل صوتي تجريبي">
    <div className="flex items-start justify-between gap-4">
      <div className="flex min-w-0 items-start gap-3"><div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#af7c42]/20 text-[#e1b15a]"><Headphones className="h-5 w-5" /></div><div className="min-w-0"><span className="inline-flex items-center gap-1 rounded-full border border-[#e1b15a]/40 px-2 py-0.5 text-[10px] font-bold text-[#e1b15a]"><SlidersHorizontal className="h-3 w-3" />محاكاة تصميمية</span><h2 className="mt-2 truncate font-serif text-lg">{chapterTitle}</h2><p className="mt-1 truncate text-xs text-white/65">{novelTitle} · لا يوجد تسجيل صوتي فعلي بعد</p></div></div><Volume2 className="mt-1 h-4 w-4 text-white/55" aria-hidden="true" /></div>
    <div className="mt-6"><input aria-label="موضع التشغيل التجريبي" type="range" min="0" max={duration} value={position} onChange={event => setPosition(Number(event.target.value))} className="w-full accent-[#e1b15a]" /><div className="mt-1 flex justify-between text-[11px] text-white/55" dir="ltr"><span>{formatTime(position)}</span><span>{formatTime(duration)}</span></div></div>
    <div className="mt-4 flex items-center justify-center gap-2"><Button variant="ghost" size="icon" aria-label="تقديم 30 ثانية" className="text-white/75 hover:bg-white/10 hover:text-white" onClick={() => seek(30)}><FastForward className="h-4 w-4" /></Button><Button variant="ghost" size="icon" aria-label="إرجاع 15 ثانية" className="text-white/75 hover:bg-white/10 hover:text-white" onClick={() => seek(-15)}><Rewind className="h-4 w-4" /></Button><Button size="icon" aria-label={playing ? "إيقاف التشغيل التجريبي" : "تشغيل المحاكاة"} className="h-12 w-12 rounded-full bg-[#e1b15a] text-[#1d2940] hover:bg-[#f0c878]" onClick={() => setPlaying(current => !current)}>{playing ? <Pause className="h-5 w-5" /> : <Play className="mr-[-2px] h-5 w-5" />}</Button></div>
    <div className="mt-4 flex items-center justify-between gap-3 border-t border-white/10 pt-3"><p className="text-[11px] leading-5 text-white/55">التفاعل هنا تجريبي فقط، ولن يستهلك من حدود الاستماع.</p><label className="flex items-center gap-2 text-xs text-white/70">السرعة<select aria-label="سرعة التشغيل التجريبية" value={speed} onChange={event => setSpeed(event.target.value)} className="rounded-lg border border-white/15 bg-white/10 px-2 py-1 text-xs text-white outline-none"><option value="0.75">0.75x</option><option value="1">1x</option><option value="1.25">1.25x</option><option value="1.5">1.5x</option><option value="2">2x</option></select></label></div><div className="sr-only" aria-live="polite">تقدم المحاكاة {Math.round(progress)} بالمئة</div>
  </section>;
}
