import SiteLayout from "@/components/SiteLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { KeyRound, Loader2, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const login = trpc.auth.adminLogin.useMutation({
    onSuccess: async () => {
      await utils.auth.me.invalidate();
      setLocation("/admin");
    },
    onError: e => toast.error(e.message),
  });

  return (
    <SiteLayout>
      <div className="container max-w-md py-16 md:py-24">
        <div className="text-center">
          <div className="mx-auto h-14 w-14 rounded-full bg-accent flex items-center justify-center">
            <ShieldCheck className="h-7 w-7 text-[color:var(--gold)]" />
          </div>
          <div className="text-xs tracking-[0.3em] text-[color:var(--gold)] font-bold mt-6">ADMIN ACCESS</div>
          <h1 className="font-display font-black text-3xl mt-2">관리자 전용 로그인</h1>
          <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
            교육관리와 설문문항 관리는 별도 관리자 계정으로 보호됩니다.
          </p>
        </div>

        <form
          className="mt-8 bg-card border border-border p-6 space-y-5"
          onSubmit={e => {
            e.preventDefault();
            login.mutate({ username, password });
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="admin-username">관리자 아이디</Label>
            <Input
              id="admin-username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              autoComplete="username"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="admin-password">관리자 비밀번호</Label>
            <Input
              id="admin-password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>
          <Button type="submit" className="w-full" size="lg" disabled={login.isPending}>
            {login.isPending ? <Loader2 className="animate-spin" /> : <KeyRound />}
            관리자 로그인
          </Button>
          <p className="text-xs text-muted-foreground text-center leading-relaxed">
            로그인 상태는 이 브라우저에서 7일간 유지됩니다.
          </p>
        </form>

        <div className="text-center mt-6">
          <Link href="/" className="text-sm text-muted-foreground underline underline-offset-4">
            홈으로 돌아가기
          </Link>
        </div>
      </div>
    </SiteLayout>
  );
}
