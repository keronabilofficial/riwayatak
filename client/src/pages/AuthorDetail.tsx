import AuthorFollowButton from "@/components/AuthorFollowButton";
import BookCard from "@/components/BookCard";
import ContentSeo from "@/components/ContentSeo";
import PublicLayout from "@/components/PublicLayout";
import { trpc } from "@/lib/trpc";
import { UserRound } from "lucide-react";

export default function AuthorDetail({ slug }: { slug: string }) {
  const { data: author, isLoading } = trpc.catalog.author.useQuery({ slug });
  if (isLoading) return <PublicLayout><div className="container py-24"><div className="h-72 animate-pulse rounded-3xl bg-[#e9dfca]" /></div></PublicLayout>;
  if (!author) return <PublicLayout><div className="container py-24 text-center"><h1 className="font-serif text-4xl">هذا المؤلف غير متاح</h1></div></PublicLayout>;
  return <PublicLayout><ContentSeo type="Person" title={author.name} description={author.shortBio || author.biography} url={`${window.location.origin}/authors/${author.slug}`} image={author.imageUrl} keywords={author.works.map(work => work.title)} /><section className="border-b border-[#1d2940]/10 bg-[#e9dfca]/45"><div className="container flex flex-col items-center gap-7 py-14 text-center md:flex-row md:text-right"><div className="grid h-32 w-32 shrink-0 place-items-center overflow-hidden rounded-full bg-[#1d2940] text-[#d5a85e]">{author.imageUrl ? <img src={author.imageUrl} alt={author.name} className="h-full w-full object-cover" /> : <UserRound className="h-10 w-10" />}</div><div><p className="text-xs font-bold tracking-[.18em] text-[#af7c42]">كاتب في المكتبة</p><h1 className="mt-2 font-serif text-5xl">{author.name}</h1><p className="mt-4 max-w-3xl whitespace-pre-line leading-8 text-[#526071]">{author.biography || author.shortBio || "تظهر هنا سيرة المؤلف وملامح مشروعه الأدبي."}</p><AuthorFollowButton authorId={author.id} /></div></div></section><section className="container py-16"><h2 className="font-serif text-3xl">أعمال {author.name}</h2>{author.works.length ? <div className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">{author.works.map(novel => <BookCard key={novel.id} novel={novel} featured />)}</div> : <p className="mt-5 text-sm text-[#667085]">لا توجد أعمال منشورة لهذا المؤلف حتى الآن.</p>}</section></PublicLayout>;
}
