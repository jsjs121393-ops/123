import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Loader2, Lock, ShieldAlert } from "lucide-react";
import { Link } from "wouter";

/** 로그인한 관리자(role=admin)에게만 children을 보여준다. */
export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="container py-32 flex justify-center text-muted-foreground">
        <Loader2 className="animate-spin" aria-label="확인 중" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container py-24 max-w-md text-center">
        <Lock className="mx-auto h-9 w-9 text-[color:var(--gold)]" />
        <h1 className="font-display font-black text-2xl mt-4">관리자 로그인이 필요합니다</h1>
        <p className="mt-3 text-muted-foreground leading-relaxed">
          이 메뉴는 로그인한 교육처 관리자만 이용할 수 있습니다.
        </p>
        <Button asChild className="mt-6">
          <Link href="/admin/login">관리자 로그인</Link>
        </Button>
      </div>
    );
  }

  if (user.role !== "admin") {
    return (
      <div className="container py-24 max-w-md text-center">
        <ShieldAlert className="mx-auto h-9 w-9 text-destructive" />
        <h1 className="font-display font-black text-2xl mt-4">접근 권한이 없습니다</h1>
        <p className="mt-3 text-muted-foreground leading-relaxed">
          현재 계정({user.name ?? "사용자"})은 관리자 권한이 없습니다. 관리자에게 권한 부여를 요청해 주세요.
        </p>
        <Button asChild variant="outline" className="mt-6">
          <Link href="/">홈으로</Link>
        </Button>
      </div>
    );
  }

  return <>{children}</>;
}
