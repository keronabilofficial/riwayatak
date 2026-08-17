import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Flag, MessageCircle, Send, Trash2 } from "lucide-react";
import { useState } from "react";

export default function ChapterComments({ chapterId }: { chapterId: number }) {
  const { isAuthenticated, user } = useAuth();
  const [body, setBody] = useState("");
  const utils = trpc.useUtils();
  const { data: comments } = trpc.community.comments.useQuery({ chapterId });
  const addComment = trpc.community.addComment.useMutation({ onSuccess: () => { setBody(""); void utils.community.comments.invalidate({ chapterId }); } });
  const deleteComment = trpc.community.deleteComment.useMutation({ onSuccess: () => void utils.community.comments.invalidate({ chapterId }) });
  const reportComment = trpc.community.reportComment.useMutation();
  const report = (commentId: number) => {
    const reason = window.prompt("اكتب سبب الإبلاغ باختصار:");
    if (reason?.trim()) reportComment.mutate({ commentId, reason: reason.trim() });
  };
  return <section className="mt-12 rounded-2xl border border-current/10 bg-current/5 p-5" aria-label="نقاش الفصل">
    <div className="flex items-center gap-2"><MessageCircle className="h-5 w-5 text-[#af7c42]" /><div><h2 className="font-serif text-2xl">نقاش الفصل</h2><p className="mt-1 text-xs opacity-65">ناقش الفصل باحترام، وتجنب كشف أحداث الفصول التالية.</p></div></div>
    {isAuthenticated ? <form className="mt-5" onSubmit={event => { event.preventDefault(); if (body.trim()) addComment.mutate({ chapterId, body: body.trim() }); }}><textarea value={body} onChange={event => setBody(event.target.value)} maxLength={1200} rows={3} placeholder="اكتب تعليقك على هذا الفصل…" className="w-full resize-y rounded-xl border border-current/15 bg-background/70 p-3 text-sm outline-none focus:ring-2 focus:ring-[#af7c42]/40" /><div className="mt-2 flex items-center justify-between"><span className="text-xs opacity-55">{body.length}/1200</span><Button type="submit" size="sm" className="bg-[#af7c42] text-white hover:bg-[#936536]" disabled={!body.trim() || addComment.isPending}><Send className="ml-1 h-4 w-4" />{addComment.isPending ? "جارٍ النشر…" : "نشر التعليق"}</Button></div></form> : <button type="button" className="mt-5 w-full rounded-xl border border-dashed border-current/20 p-3 text-sm text-[#af7c42] hover:bg-current/5" onClick={() => startLogin()}>سجّل الدخول للمشاركة في نقاش الفصل</button>}
    <div className="mt-5 space-y-3">{comments?.length ? comments.map(comment => <article key={comment.id} className="rounded-xl border border-current/10 bg-background/60 p-4"><div className="flex items-center justify-between gap-3"><strong className="text-sm">{comment.userName || "قارئ"}</strong><time className="text-[11px] opacity-55">{new Date(comment.createdAt).toLocaleDateString("ar-EG")}</time></div><p className="mt-2 whitespace-pre-wrap text-sm leading-7">{comment.body}</p><div className="mt-2 flex gap-2">{user?.id === comment.userId ? <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs text-destructive" onClick={() => deleteComment.mutate({ id: comment.id })}><Trash2 className="ml-1 h-3.5 w-3.5" />حذف</Button> : isAuthenticated ? <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs opacity-70" onClick={() => report(comment.id)} disabled={reportComment.isPending}><Flag className="ml-1 h-3.5 w-3.5" />إبلاغ</Button> : null}</div></article>) : <p className="rounded-xl bg-background/60 p-4 text-sm opacity-65">لا توجد تعليقات بعد. كن أول من يشارك رأيه في هذا الفصل.</p>}</div>
  </section>;
}
