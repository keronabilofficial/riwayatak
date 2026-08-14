import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export default function SectionHeading({ eyebrow, title, href, linkLabel = "عرض الكل" }: { eyebrow?: string; title: string; href?: string; linkLabel?: string }) {
  return <div className="mb-7 flex items-end justify-between gap-5"><div>{eyebrow && <p className="mb-2 text-xs font-bold tracking-[0.16em] text-[#af7c42]">{eyebrow}</p>}<h2 className="font-serif text-3xl text-[#1d2940] md:text-4xl">{title}</h2></div>{href && <Link href={href} className="group inline-flex items-center gap-2 text-sm font-bold text-[#1d2940] hover:text-[#af7c42]">{linkLabel}<ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" /></Link>}</div>;
}
