import PublicLayout from "@/components/PublicLayout";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { getPlanPresentation } from "@/lib/planPresentation";
import { startLogin } from "@/const";
import { Check, Headphones, Loader2, LockKeyhole, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

type PlanName = "go" | "plus" | "ultra" | "enterprise";
type BillingTerm = "monthly" | "quarterly" | "hundred_days" | "six_months" | "yearly";

const planOrder: PlanName[] = ["go", "plus", "ultra", "enterprise"];
const planLabels: Record<PlanName, string> = { go: "Go", plus: "Plus", ultra: "Ultra", enterprise: "Enterprise" };
const termLabels: Record<BillingTerm, string> = { monthly: "شهريًا", quarterly: "90 يومًا", hundred_days: "100 يوم", six_months: "6 أشهر", yearly: "سنة" };

export default function Plans() {
  const { isAuthenticated, user } = useAuth();
  const { data: options = [], isLoading } = trpc.subscriptions.plans.useQuery();
  const { data: appearance } = trpc.platform.appearance.useQuery();
  const presentation = getPlanPresentation(appearance);
  const { data: currentSubscription } = trpc.subscriptions.mine.useQuery(undefined, { enabled: isAuthenticated });
  const [email, setEmail] = useState(user?.email ?? "");
  const [phone, setPhone] = useState("");
  const [selected, setSelected] = useState<{ planName: PlanName; billingTerm: BillingTerm } | null>(null);
  const startCheckout = trpc.subscriptions.startCheckout.useMutation({
    onSuccess: ({ checkoutUrl }) => {
      toast.success("سيتم فتح صفحة الدفع الآمنة في نافذة جديدة.");
      window.open(checkoutUrl, "_blank", "noopener,noreferrer");
    },
    onError: error => toast.error(error.message),
  });
  const refreshSubscription = trpc.useUtils().subscriptions.mine;
  const cancelAtPeriodEnd = trpc.subscriptions.cancelAtPeriodEnd.useMutation({ onSuccess: async () => { await refreshSubscription.invalidate(); toast.success("سيبقى اشتراكك نشطًا حتى نهاية دورته الحالية."); }, onError: error => toast.error(error.message) });
  const resumeRenewal = trpc.subscriptions.resumeRenewal.useMutation({ onSuccess: async () => { await refreshSubscription.invalidate(); toast.success("تم استئناف تجديد الاشتراك."); }, onError: error => toast.error(error.message) });

  const groupedOptions = useMemo(() => planOrder.map(planName => ({ planName, options: options.filter(option => option.planName === planName) })), [options]);
  const beginCheckout = () => {
    if (!isAuthenticated) return startLogin();
    if (!selected) return toast.error("اختر مدة الباقة أولًا.");
    startCheckout.mutate({ ...selected, billingEmail: email, phoneNumber: phone });
  };

  return <PublicLayout>
    <section className="border-b border-border py-16 md:py-24" style={{ backgroundImage: `radial-gradient(circle_at_top,${presentation.accentColor}29,transparent 42%)` }}>
      <div className="container text-center">
        <p className="text-sm font-bold" style={{ color: presentation.accentColor }}>{presentation.plansEyebrow} · {presentation.platformName}</p>
        <h1 className="mt-4 font-serif text-4xl leading-tight md:text-6xl">{presentation.plansTitle}</h1>
        <p className="mx-auto mt-5 max-w-2xl leading-8 text-muted-foreground">{presentation.plansDescription}</p>
        {currentSubscription?.cycleStatus === "active" && <div className="mx-auto mt-7 flex max-w-xl flex-wrap items-center justify-center gap-3 rounded-2xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm font-bold text-primary"><span className="inline-flex items-center gap-2"><Sparkles className="h-4 w-4" />اشتراكك الحالي: {planLabels[currentSubscription.planName]} حتى {currentSubscription.endsAt ? new Date(currentSubscription.endsAt).toLocaleDateString("ar-EG") : ""}</span>{currentSubscription.cancelAtPeriodEnd ? <Button size="sm" variant="outline" onClick={() => resumeRenewal.mutate()} disabled={resumeRenewal.isPending}>استئناف التجديد</Button> : <Button size="sm" variant="outline" onClick={() => cancelAtPeriodEnd.mutate()} disabled={cancelAtPeriodEnd.isPending}>إلغاء عند نهاية الدورة</Button>}</div>}
      </div>
    </section>
    <section className="container py-12 md:py-16">
      {isLoading ? <div className="grid min-h-80 place-items-center"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div> : <div className="grid gap-5 lg:grid-cols-4">{groupedOptions.map(group => {
        const primary = group.options[0];
        if (!primary) return null;
        const selectedOption = selected?.planName === group.planName && selected.billingTerm === primary.billingTerm;
        return <article key={group.planName} className={`flex flex-col rounded-3xl border p-6 transition-shadow ${group.planName === "ultra" ? "border-primary bg-primary/5 shadow-lg shadow-primary/10" : "border-border bg-card"}`}>
          <div className="flex items-center justify-between"><h2 className="font-serif text-3xl">{primary.label || planLabels[group.planName]}</h2>{group.planName === "ultra" && <span className="rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground">الأوسع</span>}</div>
          <p className="mt-4 text-sm leading-7 text-muted-foreground">{primary.novelLimit} رواية في كل دورة اشتراك</p>
          <ul className="mt-6 grid gap-3 text-sm"> <li className="flex gap-2"><Check className="h-4 w-4 shrink-0 text-primary" />الفصلان الأولان مجانًا من كل رواية</li><li className="flex gap-2"><Headphones className="h-4 w-4 shrink-0 text-primary" />{primary.audioChapterLimitPerNovel === null ? "كل الفصول الصوتية المتاحة" : `${primary.audioChapterLimitPerNovel} فصول صوتية لكل رواية`}</li></ul>
          <div className="mt-7 grid gap-2">{group.options.map(option => <button key={option.billingTerm} type="button" onClick={() => setSelected({ planName: option.planName, billingTerm: option.billingTerm })} className={`rounded-xl border px-3 py-3 text-right text-sm transition-colors ${selected?.planName === option.planName && selected.billingTerm === option.billingTerm ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary/50"}`}><strong>{option.priceEgp} جنيه</strong><span className="mr-2 text-xs opacity-80">/ {termLabels[option.billingTerm]}</span></button>)}</div>
          <Button className="mt-6 w-full" variant={selectedOption ? "default" : "outline"} onClick={() => setSelected({ planName: primary.planName, billingTerm: primary.billingTerm })}>اختيار {planLabels[group.planName]}</Button>
        </article>;
      })}</div>}
      <section className="mx-auto mt-12 max-w-xl rounded-3xl border border-border bg-card p-6 md:p-8">
        <div className="flex items-center gap-3"><LockKeyhole className="h-5 w-5 text-primary" /><div><h2 className="font-serif text-2xl">{presentation.checkoutTitle}</h2><p className="mt-1 text-sm text-muted-foreground">{presentation.checkoutDescription}</p></div></div>
        <div className="mt-6 grid gap-4"><div className="grid gap-2"><Label htmlFor="billing-email">البريد الإلكتروني</Label><Input id="billing-email" dir="ltr" type="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="name@example.com" /></div><div className="grid gap-2"><Label htmlFor="billing-phone">رقم الهاتف بصيغة دولية</Label><Input id="billing-phone" dir="ltr" type="tel" value={phone} onChange={event => setPhone(event.target.value)} placeholder="+201000000000" /></div><Button disabled={startCheckout.isPending || !selected} onClick={beginCheckout}>{startCheckout.isPending ? <><Loader2 className="h-4 w-4 animate-spin" />جارٍ فتح الدفع…</> : isAuthenticated ? "الانتقال إلى الدفع الآمن" : "سجّل الدخول للمتابعة"}</Button></div>
      </section>
    </section>
  </PublicLayout>;
}
