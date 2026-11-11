import { Button } from "@/components/ui/button";
import { useAuth } from "@/_core/hooks/useAuth";
import { EMBLEM, SLOGAN } from "@/lib/format";
import { cn } from "@/lib/utils";
import { LogIn, LogOut, ShieldCheck } from "lucide-react";
import { Link, useLocation } from "wouter";

type NavItem = { href: string; label: string; admin?: boolean };

const NAV: NavItem[] = [
  { href: "/courses", label: "교육안내·신청" },
  { href: "/survey", label: "설문조사" },
  { href: "/stats", label: "결과통계" },
  { href: "/admin/survey", label: "설문문항", admin: true },
  { href: "/admin", label: "교육관리", admin: true },
];

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [loc] = useLocation();
  const isAdmin = user?.role === "admin";
  const items = NAV.filter(n => !n.admin || isAdmin);

  const isActive = (href: string) =>
    href === "/admin" ? loc === "/admin" : loc === href || loc.startsWith(href + "/");

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border">
        <div className="container flex items-center justify-between gap-4 py-3">
          <Link href="/" className="flex items-center gap-3 min-w-0">
            <img src={EMBLEM} alt="네프티스 연합 엠블럼" className="h-11 w-11" />
            <div className="leading-tight min-w-0">
              <div className="font-display font-black text-lg tracking-tight">네프티스 연합</div>
              <div className="text-[11px] tracking-[0.28em] text-muted-foreground">
                EDUCATION BUREAU · 교육처
              </div>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1" aria-label="주요 메뉴">
            {items.map(n => (
              <Link
                key={n.href}
                href={n.href}
                className={cn(
                  "px-3 py-2 text-sm font-medium border-b-2 border-transparent transition-colors hover:text-[color:var(--gold)]",
                  isActive(n.href) && "border-[color:var(--gold)] text-foreground",
                  n.admin && "text-[color:var(--gold)]"
                )}
              >
                {n.admin && <ShieldCheck className="inline h-3.5 w-3.5 mr-1 -mt-0.5" />}
                {n.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2 shrink-0">
            {user ? (
              <>
                <span className="hidden lg:inline text-xs text-muted-foreground">
                  {user.name ?? "사용자"}
                  {isAdmin && " · 관리자"}
                </span>
                <Button variant="outline" size="sm" onClick={() => logout()}>
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">로그아웃</span>
                </Button>
              </>
            ) : (
              <Button size="sm" variant="outline" asChild>
                <Link href="/admin/login">
                <LogIn className="h-4 w-4" />
                관리자 로그인
                </Link>
              </Button>
            )}
          </div>
        </div>
        {/* 모바일 탭 */}
        <nav
          className="md:hidden border-t border-border overflow-x-auto"
          aria-label="주요 메뉴(모바일)"
        >
          <div className="container flex gap-1 py-1 w-max min-w-full">
            {items.map(n => (
              <Link
                key={n.href}
                href={n.href}
                className={cn(
                  "px-3 py-2 text-sm whitespace-nowrap border-b-2 border-transparent",
                  isActive(n.href) && "border-[color:var(--gold)] font-bold",
                  n.admin && "text-[color:var(--gold)]"
                )}
              >
                {n.label}
              </Link>
            ))}
          </div>
        </nav>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="mt-20 bg-[color:var(--ink)] text-[#e9e3df]">
        <div className="container py-10 flex flex-col md:flex-row gap-6 md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <img src={EMBLEM} alt="" className="h-14 w-14 rounded-full bg-[#f0eceb] p-1" />
            <div>
              <div className="font-display font-bold text-lg">네프티스 연합 교육처</div>
              <div className="text-sm text-[#b9b0aa]">{SLOGAN}</div>
            </div>
          </div>
          <div className="text-xs tracking-[0.3em] text-[#b9b0aa]">EST. 2024</div>
        </div>
      </footer>
    </div>
  );
}

/** 페이지 상단 제목 영역 */
export function PageHeading({
  eyebrow,
  title,
  desc,
}: {
  eyebrow: string;
  title: string;
  desc?: string;
}) {
  return (
    <div className="container pt-12 pb-8 rise">
      <div className="text-xs tracking-[0.32em] text-[color:var(--gold)] font-bold">{eyebrow}</div>
      <h1 className="font-display font-black text-3xl md:text-4xl mt-2">{title}</h1>
      {desc && <p className="mt-3 text-muted-foreground max-w-2xl leading-relaxed">{desc}</p>}
      <div className="rule-double mt-6" />
    </div>
  );
}
