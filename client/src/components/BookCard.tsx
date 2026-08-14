import { BookOpen, Clock3 } from "lucide-react";
import { Link } from "wouter";

export type NovelCardData = {
  id: number;
  title: string;
  subtitle?: string | null;
  slug: string;
  shortDescription?: string | null;
  chapterCount: number;
  authorName: string;
  authorSlug: string;
  coverUrl?: string | null;
  coverAlt?: string | null;
  updatedAt?: Date | string | null;
};

export default function BookCard({ novel, featured = false }: { novel: NovelCardData; featured?: boolean }) {
  return (
    <article className={`group ${featured ? "grid gap-5 sm:grid-cols-[148px_1fr]" : ""}`}>
      <Link href={`/novels/${novel.slug}`} className={`relative block overflow-hidden rounded-[1.2rem] bg-[#263550] shadow-[0_18px_35px_-24px_rgba(29,41,64,.9)] ${featured ? "aspect-[3/4]" : "aspect-[3/4]"}`}>
        {novel.coverUrl ? <img src={novel.coverUrl} alt={novel.coverAlt || `غلاف رواية ${novel.title}`} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" /> : <div className="flex h-full flex-col justify-between bg-[radial-gradient(circle_at_top,#41516f,#1d2940_68%)] p-5 text-[#f6f1e7]"><span className="font-serif text-3xl text-[#d5a85e]">ر</span><span className="font-serif text-2xl leading-relaxed">{novel.title}</span><span className="text-xs text-white/60">روايتك بالعربية</span></div>}
        <span className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#111827]/75 to-transparent opacity-70" />
      </Link>
      <div className={`min-w-0 ${featured ? "self-center" : "pt-4"}`}>
        <Link href={`/authors/${novel.authorSlug}`} className="text-xs font-bold tracking-wide text-[#af7c42] hover:underline">{novel.authorName}</Link>
        <Link href={`/novels/${novel.slug}`} className="mt-1 block font-serif text-xl leading-tight text-[#1d2940] transition-colors hover:text-[#af7c42]">{novel.title}</Link>
        {novel.subtitle && <p className="mt-1 text-sm text-[#667085]">{novel.subtitle}</p>}
        {featured && novel.shortDescription && <p className="mt-3 line-clamp-3 text-sm leading-7 text-[#526071]">{novel.shortDescription}</p>}
        <div className="mt-3 flex items-center gap-4 text-xs text-[#667085]"><span className="inline-flex items-center gap-1"><BookOpen className="h-3.5 w-3.5" />{novel.chapterCount} فصلًا</span><span className="inline-flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" />متاح للقراءة</span></div>
      </div>
    </article>
  );
}
