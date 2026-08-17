import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Loader2, Mail } from "lucide-react";
import { useState } from "react";

export default function AdminContactMessages() {
  const { user, loading } = useAuth();
  const allowed = Boolean(user && ["editor", "admin", "super_admin"].includes(user.role));
  const messages = trpc.contact.adminList.useQuery(undefined, { enabled: allowed });
  const update = trpc.contact.adminUpdate.useMutation({ onSuccess: () => void messages.refetch() });
  const [replies, setReplies] = useState<Record<number, string>>({});
  if (loading || (allowed && messages.isLoading)) return <div className="container grid min-h-[60vh] place-items-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!allowed) return <div className="container py-20 text-center"><h1 className="font-serif text-3xl">لا تملك صلاحية الوصول</h1><p className="mt-3 text-muted-foreground">رسائل التواصل متاحة للمحررين والمديرين فقط.</p></div>;
  return <main className="container py-12" dir="rtl"><div className="flex items-center gap-3"><Mail className="h-8 w-8 text-primary" /><div><p className="text-sm font-bold text-primary">إدارة التواصل</p><h1 className="font-serif text-4xl">رسائل المستخدمين</h1></div></div><div className="mt-8 grid gap-4">{messages.data?.map(item => <article key={item.id} className="rounded-2xl border border-border bg-card p-5"><div className="flex flex-wrap items-start justify-between gap-4"><div><h2 className="font-bold">{item.subject}</h2><p className="mt-1 text-sm text-muted-foreground">{item.name} · {item.email}</p><p className="mt-1 text-xs text-muted-foreground">{new Date(item.createdAt).toLocaleString("ar-EG")}</p></div><select value={item.status} onChange={event => update.mutate({ id: item.id, status: event.target.value as "new" | "read" | "replied" | "archived", adminReply: replies[item.id] || item.adminReply || undefined })} className="rounded-lg border border-border bg-background px-3 py-2 text-sm"><option value="new">جديدة</option><option value="read">مقروءة</option><option value="replied">تم الرد</option><option value="archived">مؤرشفة</option></select></div><p className="mt-5 whitespace-pre-wrap leading-8">{item.message}</p><div className="mt-4 grid gap-2"><textarea value={replies[item.id] ?? item.adminReply ?? ""} onChange={event => setReplies(current => ({ ...current, [item.id]: event.target.value }))} placeholder="اكتب رد الإدارة هنا" className="min-h-24 rounded-xl border border-border bg-background p-3 text-sm" maxLength={5000} /><Button type="button" className="w-fit" disabled={update.isPending || !replies[item.id]?.trim()} onClick={() => update.mutate({ id: item.id, status: "replied", adminReply: replies[item.id] })}>حفظ الرد وإغلاق الرسالة</Button>{item.adminReply ? <p className="rounded-lg bg-muted p-3 text-sm">آخر رد: {item.adminReply}</p> : null}</div></article>)}{messages.data && messages.data.length === 0 ? <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">لا توجد رسائل تواصل حاليًا.</div> : null}</div></main>;
}
