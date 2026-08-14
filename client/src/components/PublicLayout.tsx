import { startLogin } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import ThemeToggle from "@/components/ThemeToggle";
import { Menu, Search, X } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";

const links = [
  { href: "/novels", label: "الروايات" },
  { href: "/authors", label: "المؤلفون" },
  { href: "/categories", label: "التصنيفات" },
  { href: "/plans", label: "الباقات" },
];

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [, navigate] = useLocation();
  const { isAuthenticated, user } = useAuth();
  const { data: appearance } = trpc.platform.appearance.useQuery();
  const platformName = appearance?.platformName ?? "روايتك بالعربية";
  const tagline = appearance?.tagline ?? "بالعربية";

  return (
    <div className="min-h-screen bg-background text-foreground" dir="rtl" style={{ "--primary": appearance?.primaryColor, "--ring": appearance?.accentColor } as React.CSSProperties}>
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-md">
        <div className="container flex h-[74px] items-center justify-between gap-5">
          <Link href="/" className="group flex items-center gap-3 text-foreground">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-primary font-serif text-xl text-primary-foreground transition-transform duration-200 group-hover:rotate-6">{platformName.slice(0, 1)}</span>
            <span>
              <strong className="block font-serif text-xl leading-none">{platformName}</strong>
              <span className="mt-1 block text-[10px] font-semibold tracking-[0.18em]" style={{ color: appearance?.accentColor }}>{tagline}</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-7 text-sm font-semibold md:flex" aria-label="التنقل الرئيسي">
            {links.map(link => <Link key={link.href} href={link.href} className="transition-colors hover:text-[#af7c42]">{link.label}</Link>)}
          </nav>

          <div className="hidden items-center gap-2 md:flex">
            <Button variant="ghost" size="icon" className="rounded-full" onClick={() => navigate("/search")} aria-label="البحث"><Search className="h-5 w-5" /></Button>
            <ThemeToggle />
            {isAuthenticated ? (
              <Button variant="outline" className="border-border bg-transparent" onClick={() => navigate(user?.role !== "user" ? "/admin" : "/library")}>مكتبتي</Button>
            ) : (
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => startLogin()}>دخول</Button>
            )}
          </div>
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMenuOpen(value => !value)} aria-label="فتح القائمة">
            {menuOpen ? <X /> : <Menu />}
          </Button>
        </div>
        {menuOpen && (
          <div className="border-t border-border bg-background px-5 py-4 md:hidden">
            <nav className="grid gap-1" aria-label="التنقل المحمول">
              {[...links, { href: "/search", label: "البحث" }].map(link => <Link key={link.href} href={link.href} className="rounded-lg px-3 py-3 font-semibold hover:bg-accent" onClick={() => setMenuOpen(false)}>{link.label}</Link>)}
              <div className="px-3 py-2"><ThemeToggle compact={false} /></div>
            </nav>
          </div>
        )}
      </header>
      <main>{children}</main>
      <footer className="mt-20 border-t border-[#1d2940]/10 bg-[#1d2940] text-[#f6f1e7]">
        <div className="container grid gap-10 py-12 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <div className="mb-4 font-serif text-3xl">{platformName}</div>
            <p className="max-w-md text-sm leading-7 text-[#f6f1e7]/70">مكتبة رقمية عربية تصنع مساحة هادئة تليق بالحكايات: اكتشف الروايات، تابع الفصول، واقرأ على مهل.</p>
          </div>
          <div className="grid content-start gap-2 text-sm text-[#f6f1e7]/75"><Link href="/novels">استكشف الروايات</Link><Link href="/authors">تعرّف إلى المؤلفين</Link><Link href="/categories">التصنيفات</Link></div>
          <div className="grid content-start gap-2 text-sm text-[#f6f1e7]/75"><Link href="/legal/privacy">الخصوصية</Link><Link href="/legal/terms">شروط الاستخدام</Link><Link href="/legal/content">سياسة المحتوى</Link><Link href="/legal/copyright">حقوق النشر</Link><Link href="/legal/contact">تواصل معنا</Link></div>
        </div>
        <div className="border-t border-white/10 py-4 text-center text-xs text-[#f6f1e7]/50">© {new Date().getFullYear()} روايتك بالعربية</div>
      </footer>
    </div>
  );
}
