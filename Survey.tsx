import SiteLayout, { PageHeading } from "@/components/SiteLayout";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { CheckCircle2, Loader2, Star } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import { toast } from "sonner";

type Answers = Record<number, string | string[]>;

export default function Survey() {
  const [code, setCode] = useState("");
  const [verified, setVerified] = useState<{ applicantName: string; courseTitle: string } | null>(null);
  const [answers, setAnswers] = useState<Answers>({});
  const [finished, setFinished] = useState(false);

  const { data: questions, isLoading } = trpc.survey.questions.useQuery();
  const verify = trpc.survey.verify.useMutation({
    onSuccess: r => setVerified(r),
    onError: e => toast.error(e.message),
  });
  const submit = trpc.survey.submit.useMutation({
    onSuccess: () => setFinished(true),
    onError: e => toast.error(e.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!questions) return;
    for (const q of questions) {
      const a = answers[q.id];
      const empty = a === undefined || a === "" || (Array.isArray(a) && a.length === 0);
      if (q.required && empty) {
        toast.error(`필수 문항에 답해 주세요: ${q.text}`);
        return;
      }
    }
    submit.mutate({
      code,
      answers: Object.entries(answers).map(([qid, v]) => ({
        questionId: Number(qid),
        value: Array.isArray(v) ? JSON.stringify(v) : v,
      })),
    });
  };

  return (
    <SiteLayout>
      <PageHeading
        eyebrow="SURVEY"
        title="이수 후 설문조사"
        desc="교육이 종료된 뒤, 신청 시 발급된 신청번호로 본인 확인을 하고 설문에 참여해 주세요. 신청 1건당 1회 참여할 수 있습니다."
      />
      <div className="container max-w-2xl">
        {finished ? (
          <div className="text-center py-16">
            <CheckCircle2 className="mx-auto h-12 w-12 text-[color:var(--gold)]" />
            <h2 className="font-display font-black text-2xl mt-4">설문이 제출되었습니다</h2>
            <p className="text-muted-foreground mt-2">소중한 의견 감사합니다. 결과는 통계 화면에서 확인할 수 있습니다.</p>
            <Button asChild className="mt-6">
              <Link href="/stats">결과 통계 보기</Link>
            </Button>
          </div>
        ) : !verified ? (
          <form
            onSubmit={e => {
              e.preventDefault();
              verify.mutate({ code });
            }}
            className="bg-card border border-border p-6 space-y-4"
          >
            <h2 className="font-display font-bold text-xl">1. 본인 확인</h2>
            <div className="space-y-1.5">
              <Label htmlFor="code">신청번호</Label>
              <Input
                id="code"
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase())}
                placeholder="예) NP-A1B2C3"
                className="font-mono tracking-widest"
                required
                autoComplete="off"
              />
            </div>
            <Button type="submit" disabled={verify.isPending}>
              {verify.isPending && <Loader2 className="animate-spin" />}
              확인하고 설문 시작
            </Button>
            <p className="text-xs text-muted-foreground leading-relaxed">
              설문은 교육이 종료되고 신청이 승인된 경우에만 참여할 수 있습니다.
            </p>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="p-4 bg-accent/60 border-l-4 border-[color:var(--gold)] text-sm">
              <b>{verified.applicantName}</b>님, <b>{verified.courseTitle}</b> 교육 설문입니다.
            </div>
            {isLoading && <Loader2 className="animate-spin mx-auto" />}
            {questions?.length === 0 && (
              <p className="text-center text-muted-foreground py-10">등록된 설문 문항이 없습니다.</p>
            )}
            {questions?.map((q, i) => (
              <fieldset key={q.id} className="bg-card border border-border p-5">
                <legend className="sr-only">{q.text}</legend>
                <div className="font-display font-bold text-lg leading-snug">
                  <span className="text-[color:var(--gold)] mr-2">Q{i + 1}.</span>
                  {q.text}
                  {q.required && <span className="text-destructive ml-1">*</span>}
                </div>
                <div className="mt-4">
                  {q.type === "rating" && (
                    <Rating
                      value={Number(answers[q.id] ?? 0)}
                      onChange={v => setAnswers(a => ({ ...a, [q.id]: String(v) }))}
                    />
                  )}
                  {q.type === "single" && (
                    <RadioGroup
                      value={(answers[q.id] as string) ?? ""}
                      onValueChange={v => setAnswers(a => ({ ...a, [q.id]: v }))}
                      className="gap-3"
                    >
                      {q.options.map(o => (
                        <label key={o} className="flex items-center gap-3 text-sm">
                          <RadioGroupItem value={o} />
                          {o}
                        </label>
                      ))}
                    </RadioGroup>
                  )}
                  {q.type === "multiple" && (
                    <div className="space-y-3">
                      {q.options.map(o => {
                        const cur = (answers[q.id] as string[]) ?? [];
                        return (
                          <label key={o} className="flex items-center gap-3 text-sm">
                            <Checkbox
                              checked={cur.includes(o)}
                              onCheckedChange={chk =>
                                setAnswers(a => ({
                                  ...a,
                                  [q.id]: chk ? [...cur, o] : cur.filter(x => x !== o),
                                }))
                              }
                            />
                            {o}
                          </label>
                        );
                      })}
                    </div>
                  )}
                  {q.type === "text" && (
                    <Textarea
                      rows={4}
                      maxLength={3000}
                      value={(answers[q.id] as string) ?? ""}
                      onChange={e => setAnswers(a => ({ ...a, [q.id]: e.target.value }))}
                    />
                  )}
                </div>
              </fieldset>
            ))}
            {!!questions?.length && (
              <Button type="submit" size="lg" className="w-full" disabled={submit.isPending}>
                {submit.isPending && <Loader2 className="animate-spin" />}
                설문 제출
              </Button>
            )}
          </form>
        )}
      </div>
    </SiteLayout>
  );
}

function Rating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const labels = ["매우 불만족", "불만족", "보통", "만족", "매우 만족"];
  return (
    <div>
      <div className="flex gap-1" role="radiogroup" aria-label="별점">
        {[1, 2, 3, 4, 5].map(n => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            aria-label={`${n}점`}
            onClick={() => onChange(n)}
            className="p-1"
          >
            <Star
              className={cn(
                "h-9 w-9 transition-colors",
                n <= value ? "fill-[color:var(--gold)] text-[color:var(--gold)]" : "text-border"
              )}
            />
          </button>
        ))}
      </div>
      <div className="text-xs text-muted-foreground mt-1 h-4">{value ? `${value}점 · ${labels[value - 1]}` : ""}</div>
    </div>
  );
}
