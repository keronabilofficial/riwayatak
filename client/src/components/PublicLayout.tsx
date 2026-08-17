import { startLogin } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import ThemeToggle from "@/components/ThemeToggle";
import { Menu, Search, X } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { languageOptions, useLanguage, type LanguageCode } from "@/contexts/LanguageContext";
import { textFor } from "@/lib/languageText";

const links = [
  { href: "/novels", label: "الروايات" },
  { href: "/authors", label: "المؤلفون" },
  { href: "/categories", label: "التصنيفات" },
  { href: "/plans", label: "الباقات" },
];

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [, navigate] = useLocation();
  const { isAuthenticated, logout } = useAuth();
  const { language, direction, setLanguage } = useLanguage();
  const text = textFor(language);
  const handleLogout = async () => { await logout(); setMenuOpen(false); navigate("/"); };
  const { data: appearance } = trpc.platform.appearance.useQuery();
  const { data: socialLinks } = trpc.platform.socialLinks.useQuery();
  const platformName = appearance?.platformName ?? "روايتك بالعربية";
  const tagline = appearance?.tagline ?? text.tagline;

  return (
    <div className="min-h-screen bg-background text-foreground" dir={direction} style={{ "--primary": appearance?.primaryColor, "--ring": appearance?.accentColor } as React.CSSProperties}>
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-md">
        <div className="container flex h-[74px] items-center justify-between gap-5">
          <Link href="/" className="group flex items-center gap-3 text-foreground">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/10 p-1 transition-transform duration-200 group-hover:rotate-6"><img src="/manus-storage/riwayatak-user-logo_43e04bf2.png" alt="شعار روايتك بالعربية" className="h-full w-full object-contain" /></span>
            <span>
              <strong className="block font-serif text-xl leading-none">{platformName}</strong>
              <span className="mt-1 block text-[10px] font-semibold tracking-[0.18em]" style={{ color: appearance?.accentColor }}>{tagline}</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-7 text-sm font-semibold md:flex" aria-label="التنقل الرئيسي">
            {links.map(link => <Link key={link.href} href={link.href} className="transition-colors hover:text-[#af7c42]">{link.href === "/novels" ? text.novels : link.href === "/authors" ? text.authors : link.href === "/categories" ? text.categories : text.plans}</Link>)}
          </nav>

          <div className="hidden items-center gap-2 md:flex">
            <Button variant="ghost" size="icon" className="rounded-full" onClick={() => navigate("/search")} aria-label={text.search}><Search className="h-5 w-5" /></Button><label className="sr-only" htmlFor="site-language">{text.language}</label><select id="site-language" aria-label={text.language} value={language} onChange={event => setLanguage(event.target.value as LanguageCode)} className="h-9 rounded-lg border border-border bg-background px-2 text-xs text-foreground">{languageOptions.map(option => <option key={option.code} value={option.code}>{option.label}</option>)}</select>
            <ThemeToggle />
            {isAuthenticated ? (
              <>
                <Button variant="outline" className="border-border bg-transparent" onClick={() => navigate("/profile")}>{text.profile}</Button>
                <Button variant="outline" className="border-border bg-transparent" onClick={() => navigate("/library")}>{text.library}</Button>
                <Button variant="outline" className="border-border bg-transparent" onClick={() => navigate("/rewards")}>مكافآتي</Button>
                <Button variant="ghost" className="text-muted-foreground" onClick={() => void handleLogout()}>{text.logout}</Button>
              </>
            ) : (
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => startLogin()}>{text.login}</Button>
            )}
          </div>
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMenuOpen(value => !value)} aria-label="فتح القائمة">
            {menuOpen ? <X /> : <Menu />}
          </Button>
        </div>
        {menuOpen && (
          <div className="border-t border-border bg-background px-5 py-4 md:hidden">
            <nav className="grid gap-1" aria-label="التنقل المحمول">
              {[...links, { href: "/search", label: text.search }].map(link => <Link key={link.href} href={link.href} className="rounded-lg px-3 py-3 font-semibold hover:bg-accent" onClick={() => setMenuOpen(false)}>{link.href === "/novels" ? text.novels : link.href === "/authors" ? text.authors : link.href === "/categories" ? text.categories : link.href === "/plans" ? text.plans : text.search}</Link>)}
              {isAuthenticated ? <><button type="button" className="w-full rounded-lg px-3 py-3 text-right font-semibold hover:bg-accent" onClick={() => { navigate("/profile"); setMenuOpen(false); }}>{text.profile}</button><button type="button" className="w-full rounded-lg px-3 py-3 text-right font-semibold hover:bg-accent" onClick={() => { navigate("/rewards"); setMenuOpen(false); }}>مكافآتي</button><button type="button" className="w-full rounded-lg px-3 py-3 text-right font-semibold text-destructive hover:bg-accent" onClick={() => void handleLogout()}>تسجيل الخروج</button></> : null}
              <label className="flex items-center justify-between rounded-lg px-3 py-3 font-semibold"><span>{text.language}</span><select aria-label={text.language} value={language} onChange={event => setLanguage(event.target.value as LanguageCode)} className="rounded-lg border border-border bg-background px-2 py-1 text-xs text-foreground">{languageOptions.map(option => <option key={option.code} value={option.code}>{option.label}</option>)}</select></label><div className="px-3 py-2"><ThemeToggle compact={false} /></div>
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
          <div className="grid content-start gap-2 text-sm text-[#f6f1e7]/75"><Link href="/novels">استكشف الروايات</Link><Link href="/authors">تعرّف إلى المؤلفين</Link><Link href="/categories">التصنيفات</Link>{socialLinks?.length ? <div className="mt-4 border-t border-white/10 pt-4"><p className="mb-2 text-xs font-bold text-[#f6f1e7]/55">تواصل معنا</p><div className="flex flex-wrap gap-x-4 gap-y-2">{socialLinks.map(link => <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-[#e1b15a]">{link.label}</a>)}</div></div> : null}</div>
          <div className="grid content-start gap-2 text-sm text-[#f6f1e7]/75"><Link href="/legal/privacy">{text.privacy}</Link><Link href="/legal/terms">{text.terms}</Link><Link href="/legal/content">{text.contentPolicy}</Link><Link href="/legal/copyright">{text.copyright}</Link><Link href="/legal/contact">{text.contact}</Link></div>
        </div>
        <div className="border-t border-white/10 py-4 text-center text-xs text-[#f6f1e7]/50">© {new Date().getFullYear()} روايتك بالعربية</div>
      </footer>
    </div>
  );
}
