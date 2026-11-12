import SiteLayout from "@/components/SiteLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lock, ArrowRight } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import { toast } from "sonner";

export default function AdminLogin() {
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (username === "admin" && password === "Ns_m881544") {
      localStorage.setItem("isAdminLoggedIn", "true");
      toast.success("관리자 로그인에 성공했습니다.");
      
      setTimeout(() => {
        window.location.href = "/admin";
      }, 300);
    } else {
      toast.error("아이디 또는 비밀번호가 올바르지 않습니다.");
      setIsLoading(false);
    }
  };

  return (
    <SiteLayout>
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 bg-secondary/20">
        <div className="w-full max-w-sm bg-background border border-border/60 shadow-xl rounded-xl p-8 space-y-6">
          
          {/* 심플하고 미니멀한 헤더 */}
          <div className="space-y-2 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/5 flex items-center justify-center border border-border">
              <Lock className="w-5 h-5 text-foreground" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              Administrator
            </h1>
            <p className="text-xs text-muted-foreground">
              관리자 권한이 필요한 안전한 구역입니다.
            </p>
          </div>

          {/* 로그인 폼 */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1">
              <Input
                type="text"
                placeholder="아이디"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="h-11 px-3.5 bg-background border-border text-sm rounded-lg focus-visible:ring-1 focus-visible:ring-ring"
                required
              />
            </div>
            <div className="space-y-1">
              <Input
                type="password"
                placeholder="비밀번호"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="h-11 px-3.5 bg-background border-border text-sm rounded-lg focus-visible:ring-1 focus-visible:ring-ring"
                required
              />
            </div>

            <Button 
              type="submit" 
              className="w-full h-11 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2"
              disabled={isLoading}
            >
              {isLoading ? "로그인 중..." : "로그인"}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </form>

          {/* 하단 홈으로 가기 */}
          <div className="text-center pt-2">
            <Link 
              href="/" 
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              ← 메인으로 돌아가기
            </Link>
          </div>

        </div>
      </div>
    </SiteLayout>
  );
}
