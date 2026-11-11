import SiteLayout from "@/components/SiteLayout";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { fmtDate, fmtDateTime } from "@/lib/format";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, CalendarDays, CheckCircle2, Clock, Loader2, MapPin, User, Users } from "lucide-react";
import { useState } from "react";
import { Link, useParams } from "wouter";
import { toast } from "sonner";
import NotFound from "./NotFound";

export default function CourseDetail() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const utils = trpc.useUtils();
  const { data: course, isLoading, error } = trpc.course.get.useQuery(
    { id },
    { enabled: Number.isInteger(id), retry: false }
  );

  const [form, setForm] = useState({
    applicantName: "",
    kakaoNick: "",
    affiliation: "",
    contact: "",
    motivation: "",
  });
  const [done, setDone] = useState<{ code: string } | null>(null);

  const apply = trpc.course.submitApplication.useMutation({
    onSuccess: r => {
      setDone({ code: r.code });
      utils.course.get.invalidate({ id });
      utils.course.list.invalidate();
    },
    onError: e => toast.error(e.message),
  });

  if (isLoading) {
    return (
      <SiteLayout>
        <div className="py-40 flex justify-center text-muted-foreground">
          <Loader2 className="animate-spin" />
        </div>
      </SiteLayout>
    );
  }
  if (error?.data?.code === "NOT_FOUND" || !course) return <NotFound />;

  const remain = Math.max(0, course.capacity - course.applicantCount);
  const deadlinePassed = new Date() > course.applyDeadline;
  const canApply = course.status === "open" && !deadlinePassed && remain > 0;
  const closedReason =
    course.status !== "open"
      ? "현재 모집 중인 교육이 아닙니다."
      : deadlinePassed
        ? "신청 기간이 마감되었습니다."
        : "정원이 모두 찼습니다.";

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  return (
    <SiteLayout>
      <div className="container pt-10">
        <Link href="/courses" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> 교육 목록
        </Link>
      </div>

      <div className="container grid lg:grid-cols-[1.4fr_1fr] gap-12 mt-6">
        {/* 상세 */}
        <article>
          <div className="flex items-center gap-3">
            <StatusBadge status={course.status} />
            <span className="text-xs tracking-widest text-muted-foreground">{course.category}</span>
          </div>
          <h1 className="font-display font-black text-3xl md:text-4xl mt-3 leading-tight">{course.title}</h1>
          {course.summary && <p className="mt-3 text-lg text-foreground/75">{course.summary}</p>}
          <div className="rule-double mt-6" />

          <dl className="mt-6 grid sm:grid-cols-2 gap-x-8 gap-y-5 text-sm">
            <Info icon={CalendarDays} label="교육 일정">
              {fmtDateTime(course.startAt)}
              <br />~ {fmtDateTime(course.endAt)}
            </Info>
            <Info icon={Clock} label="신청 마감">
              {fmtDateTime(course.applyDeadline)}
            </Info>
            <Info icon={MapPin} label="장소">
              {course.location || "추후 안내"}
            </Info>
            <Info icon={User} label="강사">
              {course.instructor || "추후 안내"}
            </Info>
            <Info icon={Users} label="정원">
              {course.applicantCount}/{course.capacity}명 신청 (잔여 {remain}명)
            </Info>
          </dl>

          <section className="mt-10">
            <h2 className="font-display font-bold text-xl">교육 내용</h2>
            <p className="mt-3 whitespace-pre-line leading-8 text-foreground/85">{course.description}</p>
          </section>

          {course.requirements && (
            <section className="mt-10 p-5 bg-accent/60 border-l-4 border-[color:var(--gold)]">
              <h2 className="font-display font-bold text-lg">신청 조건</h2>
              <p className="mt-2 whitespace-pre-line leading-7 text-sm">{course.requirements}</p>
            </section>
          )}
        </article>

        {/* 신청 */}
        <aside className="lg:sticky lg:top-28 self-start">
          <div className="bg-card border border-border p-6 shadow-[0_1px_0_var(--border)]">
            {done ? (
              <div className="text-center py-4">
                <CheckCircle2 className="mx-auto h-10 w-10 text-[color:var(--gold)]" />
                <h2 className="font-display font-black text-2xl mt-3">신청이 접수되었습니다</h2>
                <p className="text-sm text-muted-foreground mt-2">
                  아래 신청번호를 꼭 보관해 주세요. 교육 종료 후 설문 참여 시 필요합니다.
                </p>
                <div className="my-5 py-4 border border-dashed border-[color:var(--gold)] bg-accent/40">
                  <div className="text-xs tracking-widest text-muted-foreground">신청번호</div>
                  <div className="font-mono font-bold text-3xl tracking-widest mt-1 select-all">{done.code}</div>
                </div>
                <Button
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard?.writeText(done.code);
                    toast.success("신청번호를 복사했습니다.");
                  }}
                >
                  신청번호 복사
                </Button>
                <p className="text-xs text-muted-foreground mt-4 leading-relaxed">
                  신청 승인 여부는 교육처에서 별도로 안내합니다.
                </p>
              </div>
            ) : canApply ? (
              <form
                onSubmit={e => {
                  e.preventDefault();
                  apply.mutate({ courseId: course.id, ...form });
                }}
                className="space-y-4"
              >
                <h2 className="font-display font-black text-xl">교육 신청서</h2>
                <Field label="이름" required>
                  <Input value={form.applicantName} onChange={set("applicantName")} required maxLength={100} />
                </Field>
                <Field label="카카오톡 닉네임" required>
                  <Input value={form.kakaoNick} onChange={set("kakaoNick")} required maxLength={100} />
                </Field>
                <Field label="소속 (국가·부서)">
                  <Input value={form.affiliation} onChange={set("affiliation")} maxLength={150} />
                </Field>
                <Field label="연락처 (오픈채팅 링크 등)">
                  <Input value={form.contact} onChange={set("contact")} maxLength={150} />
                </Field>
                <Field label="신청 동기">
                  <Textarea value={form.motivation} onChange={set("motivation")} rows={3} maxLength={2000} />
                </Field>
                <Button type="submit" className="w-full" size="lg" disabled={apply.isPending}>
                  {apply.isPending && <Loader2 className="animate-spin" />}
                  신청서 제출
                </Button>
                <p className="text-xs text-muted-foreground">
                  신청 마감: {fmtDate(course.applyDeadline)}
                </p>
              </form>
            ) : (
              <div className="text-center py-6">
                <h2 className="font-display font-black text-xl">신청할 수 없습니다</h2>
                <p className="text-sm text-muted-foreground mt-2">{closedReason}</p>
                {course.status === "completed" && (
                  <Button asChild className="mt-5">
                    <Link href="/survey">이수 설문 참여하기</Link>
                  </Button>
                )}
              </div>
            )}
          </div>
        </aside>
      </div>
    </SiteLayout>
  );
}

function Info({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-3">
      <Icon className="h-5 w-5 mt-0.5 text-[color:var(--gold)] shrink-0" />
      <div>
        <dt className="text-xs tracking-widest text-muted-foreground">{label}</dt>
        <dd className="mt-0.5 leading-relaxed">{children}</dd>
      </div>
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm">
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      {children}
    </div>
  );
}
