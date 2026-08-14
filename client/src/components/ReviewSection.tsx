import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { Pencil, Star, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

function Stars({ value, interactive = false, onChange }: { value: number; interactive?: boolean; onChange?: (value: number) => void }) {
  return <div className="flex items-center gap-1" aria-label={`${value} من 5`}>{[1, 2, 3, 4, 5].map(star => <button key={star} type="button" disabled={!interactive} onClick={() => onChange?.(star)} className={interactive ? "rounded p-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring" : "cursor-default"} aria-label={`${star} نجوم`}><Star className={`h-4 w-4 ${star <= value ? "fill-ring text-ring" : "text-muted-foreground/50"}`} /></button>)}</div>;
}

export default function ReviewSection({ novelId }: { novelId: number }) {
  const { isAuthenticated } = useAuth();
  const utils = trpc.useUtils();
  const { data: summary } = trpc.reviews.summary.useQuery({ novelId });
  const { data: reviews, isLoading } = trpc.reviews.list.useQuery({ novelId, limit: 12 });
  const { data: mine } = trpc.reviews.mine.useQuery({ novelId }, { enabled: isAuthenticated });
  const [rating, setRating] = useState(5);
  const [body, setBody] = useState("");
  useEffect(() => { if (mine) { setRating(mine.rating); setBody(mine.body); } }, [mine?.id]);
  const refresh = () => { utils.reviews.summary.invalidate({ novelId }); utils.reviews.list.invalidate({ novelId }); utils.reviews.mine.invalidate({ novelId }); };
  const save = trpc.reviews.upsert.useMutation({ onSuccess: () => { toast.success(mine ? "حُدّثت مراجعتك." : "نُشرت مراجعتك."); refresh(); }, onError: error => toast.error(error.message) });
  const remove = trpc.reviews.remove.useMutation({ onSuccess: () => { toast.success("حُذفت مراجعتك."); setRating(5); setBody(""); refresh(); }, onError: error => toast.error(error.message) });
  return <section className="border-t border-border bg-secondary/35"><div className="container py-14"><div className="flex flex-wrap items-end justify-between gap-5"><div><p className="text-sm font-bold text-ring">آراء القراء</p><h2 className="mt-1 font-serif text-3xl">التقييمات والمراجعات</h2></div><div className="rounded-xl border border-border bg-card px-5 py-3"><strong className="font-serif text-2xl">{summary?.average ? summary.average.toFixed(1) : "—"}</strong><span className="mr-2 text-sm text-muted-foreground">من 5 · {summary?.count ?? 0} مراجعة</span></div></div>{isAuthenticated ? <form className="mt-7 rounded-2xl border border-border bg-card p-5" onSubmit={event => { event.preventDefault(); save.mutate({ novelId, rating, body }); }}><div className="flex flex-wrap items-center justify-between gap-4"><div><strong>{mine ? "عدّل مراجعتك" : "اكتب مراجعتك"}</strong><p className="mt-1 text-xs text-muted-foreground">مراجعتك تمثل تجربتك الشخصية وتظهر باسم حسابك.</p></div><Stars value={rating} interactive onChange={setRating} /></div><Textarea required minLength={12} maxLength={2000} value={body} onChange={event => setBody(event.target.value)} placeholder="كيف كانت تجربتك مع الرواية؟" className="mt-4 min-h-28" /><div className="mt-4 flex flex-wrap gap-2"><Button type="submit" className="bg-primary text-primary-foreground" disabled={save.isPending}><Pencil className="ml-2 h-4 w-4" />{mine ? "حفظ التعديل" : "نشر المراجعة"}</Button>{mine && <Button type="button" variant="outline" className="border-destructive/35 text-destructive" onClick={() => remove.mutate({ novelId })} disabled={remove.isPending}><Trash2 className="ml-2 h-4 w-4" />حذف</Button>}</div></form> : <div className="mt-7 rounded-2xl border border-dashed border-ring/45 bg-card/60 p-5 text-sm"><strong>هل أنهيت الرواية أو بدأت قراءتها؟</strong><span className="mr-2 text-muted-foreground">سجّل الدخول لتشارك رأيك الحقيقي.</span><Button variant="link" className="mr-2 h-auto p-0 text-ring" onClick={() => startLogin()}>تسجيل الدخول</Button></div>}<div className="mt-7 grid gap-4">{isLoading ? <div className="h-32 animate-pulse rounded-2xl bg-card/60" /> : reviews?.length ? reviews.map(review => <article key={review.id} className="rounded-2xl border border-border bg-card p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><strong>{review.userName || "قارئ"}</strong><span className="mr-2 text-xs text-muted-foreground">{new Date(review.updatedAt).toLocaleDateString("ar")}</span></div><Stars value={review.rating} /></div><p className="mt-4 whitespace-pre-line leading-8 text-muted-foreground">{review.body}</p></article>) : <p className="rounded-2xl border border-dashed border-border bg-card/45 p-6 text-center text-sm text-muted-foreground">لا توجد مراجعات منشورة بعد. كن أول من يشارك تجربة قراءة حقيقية.</p>}</div></div></section>;
}
