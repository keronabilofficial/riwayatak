import PublicLayout from "@/components/PublicLayout";
import LibraryCommunityHub from "@/components/LibraryCommunityHub";
import { Link } from "wouter";

export default function CommunityHub() {
  return <PublicLayout><section className="container pt-14 md:pt-20"><p className="text-sm font-bold text-[#af7c42]">مساحتك التفاعلية</p><h1 className="mt-3 font-serif text-4xl text-[#1d2940] md:text-5xl">قوائم القراءة وتحدياتك</h1><p className="mt-4 max-w-2xl leading-8 text-[#667085]">أنشئ قوائم عامة أو خاصة، احتفظ بما تريد قراءته لاحقًا، وتابع إنجازاتك وتقدم تحدي القراءة الشهري.</p><Link href="/library" className="mt-5 inline-block text-sm font-bold text-[#af7c42] hover:underline">العودة إلى مكتبتي</Link></section><LibraryCommunityHub /></PublicLayout>;
}
