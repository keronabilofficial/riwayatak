import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { BellRing } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function AuthorFollowButton({ authorId }: { authorId: number }) {
  const { isAuthenticated } = useAuth();
  const { data: initial } = trpc.community.isFollowingAuthor.useQuery({ authorId }, { enabled: isAuthenticated });
  const [followed, setFollowed] = useState<boolean | null>(null);
  const mutation = trpc.community.toggleAuthorFollow.useMutation({ onSuccess: result => { setFollowed(result.active); toast.success(result.active ? "ستصلك تنبيهات أعمال هذا المؤلف." : "أُوقفت متابعة المؤلف."); } });
  const active = followed ?? initial ?? false;
  return <Button type="button" variant="outline" className={`mt-5 border-[#af7c42]/35 ${active ? "bg-[#af7c42]/10 text-[#8c6335]" : ""}`} onClick={() => isAuthenticated ? mutation.mutate({ authorId }) : startLogin()} disabled={mutation.isPending}><BellRing className="ml-2 h-4 w-4" />{active ? "تتابع المؤلف" : "تابع المؤلف"}</Button>;
}
