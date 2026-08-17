import PublicLayout from "@/components/PublicLayout";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, UserCircle } from "lucide-react";
import { countSuggestionStatuses, translationSuggestionLabels } from "@/lib/translationSuggestionStatus";

export default function Profile() {
  const { user, loading } = useAuth({ redirectOnUnauthenticated: true, redirectPath: "/profile" });
  const suggestions = trpc.language.myTranslationSuggestions.useQuery(undefined, { enabled: Boolean(user) });
  if (loading || suggestions.isLoading) return <PublicLayout><div className="container grid min-h-[60vh] place-items-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></PublicLayout>;
  if (!user) return null;
  const counts = countSuggestionStatuses(suggestions.data ?? []);
  return <PublicLayout><main className="container max-w-5xl py-12 md:py-16" dir="rtl"><div className="flex items-center gap-4"><UserCircle className="h-12 w-12 text-primary" /><div><p className="text-sm font-bold text-primary">حسابي</p><h1 className="font-serif text-4xl">الملف الشخصي</h1><p className="mt-2 text-sm text-muted-foreground">{user.name || user.email || "قارئ"}</p></div></div><section className="mt-8 grid gap-5 md:grid-cols-3">{(["pending", "approved", "rejected"] as const).map(status => <Card key={status}><CardHeader className="pb-3"><CardTitle className="flex items-center justify-between text-lg">{translationSuggestionLabels[status]}<Badge variant={status === "approved" ? "default" : status === "rejected" ? "destructive" : "secondary"}>{counts[status]}</Badge></CardTitle></CardHeader><CardContent><p className="text-sm text-muted-foreground">اقتراحات ترجمة</p></CardContent></Card>)}</section><section className="mt-8"><h2 className="font-serif text-2xl">اقتراحات الترجمة التي قدمتها</h2><div className="mt-4 grid gap-4">{suggestions.data?.map(item => <article key={item.id} className="rounded-2xl border border-border bg-card p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-bold">{item.chapterTitle}</h3><p className="mt-1 text-xs text-muted-foreground">اللغة: {item.languageCode.toUpperCase()} · {new Date(item.createdAt).toLocaleDateString("ar-EG")}</p></div><Badge variant={item.status === "approved" ? "default" : item.status === "rejected" ? "destructive" : "secondary"}>{translationSuggestionLabels[item.status]}</Badge></div><p className="mt-4 text-sm text-muted-foreground">النص الحالي: {item.sourceText}</p><p className="mt-2 text-sm text-primary">اقتراحك: {item.suggestedText}</p>{item.note ? <p className="mt-2 text-xs text-muted-foreground">ملاحظتك: {item.note}</p> : null}</article>)}{suggestions.data && suggestions.data.length === 0 ? <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">لم تقدم اقتراحات ترجمة بعد.</div> : null}</div></section></main></PublicLayout>;
}
