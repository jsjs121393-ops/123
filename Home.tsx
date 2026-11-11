import CourseRow from "@/components/CourseRow";
import SiteLayout from "@/components/SiteLayout";
import { Button } from "@/components/ui/button";
import { LOGO_FULL, SLOGAN } from "@/lib/format";
import { trpc } from "@/lib/trpc";
import { BarChart3, ClipboardCheck, GraduationCap, Loader2 } from "lucide-react";
import { Link } from "wouter";

const STEPS = [
  {
    icon: GraduationCap,
    title: "교육 신청",
    body: "모집 중인 교육을 확인하고 신청서를 제출하면 신청번호가 발급됩니다.",
  },
  {
    icon: ClipboardCheck,
    title: "이수 후 설문",
    body: "교육이 종료되면 신청번호로 본인 확인 후 설문에 한 번 참여할 수 있습니다.",
  },
  {
    icon: BarChart3,
    title: "결과 통계",
    body: "문항별 집계와 비율을 차트로 공개해 다음 교육의 개선에 반영합니다.",
  },
];

export default function Home() {
  const { data: courses, isLoading } = trpc.course.list.useQuery();
  const open = (courses ?? []).filter(c => c.status === "open");
  const shown = open.length ? open : (courses ?? []).slice(0, 3);

  return (
    <SiteLayout>
      {/* 히어로 */}
      <section className="relative overflow-hidden">
        <div className="container grid lg:grid-cols-[1.1fr_0.9fr] gap-8 items-center pt-14 pb-10">
          <div className="relative z-10">
            <div className="rise text-xs tracking-[0.34em] text-[color:var(--gold)] font-bold">
              NEPHTHYS UNION · EDUCATION BUREAU
            </div>
            <h1 className="rise-2 font-display font-black text-4xl md:text-6xl leading-[1.12] mt-4">
              배움으로 세우는
              <br />
              연합의 <span className="text-[color:var(--gold)]">질서</span>
            </h1>
            <p className="rise-3 mt-6 text-lg text-foreground/75 leading-relaxed max-w-xl">
              네프티스 연합 교육처의 교육 신청, 이수 후 설문, 결과 통계를 한곳에서 진행합니다.
            </p>
            <div className="rise-3 mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/courses">교육 신청하기</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/survey">이수 설문 참여</Link>
              </Button>
              <Button asChild size="lg" variant="ghost">
                <Link href="/stats">결과 통계 보기</Link>
              </Button>
            </div>
          </div>
          <div className="relative flex justify-center">
            <div className="sunburst absolute inset-0 -z-0 scale-125" aria-hidden />
            <img
              src={LOGO_FULL}
              alt={`네프티스 연합 엠블럼 — ${SLOGAN}`}
              className="relative max-h-[460px] w-auto"
            />
          </div>
        </div>
      </section>

      {/* 모집중 교육 */}
      <section className="container mt-6">
        <div className="ornament text-sm tracking-[0.3em] font-bold">✦ ✦ ✦</div>
        <div className="flex items-end justify-between gap-4 mt-8">
          <div>
            <div className="text-xs tracking-[0.3em] text-[color:var(--gold)] font-bold">
              {open.length ? "NOW ENROLLING" : "COURSES"}
            </div>
            <h2 className="font-display font-black text-2xl md:text-3xl mt-1">
              {open.length ? "지금 신청할 수 있는 교육" : "교육 안내"}
            </h2>
          </div>
          <Link href="/courses" className="text-sm font-bold underline underline-offset-4 shrink-0">
            전체 보기
          </Link>
        </div>
        <div className="mt-4 border-t border-foreground">
          {isLoading && (
            <div className="py-16 flex justify-center text-muted-foreground">
              <Loader2 className="animate-spin" />
            </div>
          )}
          {!isLoading && shown.length === 0 && (
            <p className="py-16 text-center text-muted-foreground">
              현재 공개된 교육이 없습니다. 새 교육이 등록되면 이곳에 안내됩니다.
            </p>
          )}
          {shown.map(c => (
            <CourseRow key={c.id} c={c} />
          ))}
        </div>
      </section>

      {/* 이용 절차 */}
      <section className="container mt-20">
        <h2 className="font-display font-black text-2xl md:text-3xl">이용 절차</h2>
        <ol className="mt-6 grid md:grid-cols-3 border-t border-foreground">
          {STEPS.map((s, i) => (
            <li
              key={s.title}
              className="py-6 md:px-6 md:first:pl-0 md:border-l md:first:border-l-0 border-border"
            >
              <div className="flex items-center gap-3">
                <span className="font-display font-black text-3xl text-[color:var(--gold)]">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <s.icon className="h-5 w-5" />
              </div>
              <h3 className="font-display font-bold text-lg mt-3">{s.title}</h3>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{s.body}</p>
            </li>
          ))}
        </ol>
      </section>
    </SiteLayout>
  );
}
