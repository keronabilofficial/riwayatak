import PublicLayout from "@/components/PublicLayout";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock3 } from "lucide-react";
import { Link } from "wouter";

export default function SubscriptionReturn() {
  return <PublicLayout><section className="container grid min-h-[60vh] place-items-center py-16"><div className="max-w-xl rounded-3xl border border-border bg-card p-8 text-center shadow-sm"><CheckCircle2 className="mx-auto h-10 w-10 text-primary" /><h1 className="mt-5 font-serif text-3xl">تمت العودة من صفحة الدفع</h1><p className="mt-4 leading-8 text-muted-foreground">نؤكد حالة الدفع من إشعار Paymob الموقّع. عند نجاح العملية، تُفعّل الباقة تلقائيًا في حسابك.</p><div className="mt-5 inline-flex items-center gap-2 rounded-full bg-muted px-4 py-2 text-sm"><Clock3 className="h-4 w-4" />قد يستغرق التحديث لحظات قليلة.</div><Button asChild className="mt-7"><Link href="/library">الذهاب إلى مكتبتي</Link></Button></div></section></PublicLayout>;
}
