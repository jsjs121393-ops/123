import SiteLayout, { PageHeading } from "@/components/SiteLayout";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { Loader2, MessageSquareText, Star } from "lucide-react";
import { useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, XAxis, YAxis } from "recharts";

type Stat = {
  id: number;
  text: string;
  type: "rating" | "single" | "multiple" | "text";
  answerCount: number;
  average: number;
  distribution: { label: string; count: number }[];
  texts: string[];
};

export default function Stats() {
  const [courseId, setCourseId] = useState<string>("all");
  const { data: courses } = trpc.stats.courses.useQuery();
  const { data, isLoading } = trpc.stats.get.useQuery({
    courseId: courseId === "all" ? null : Number(courseId),
  });
  const me = trpc.auth.me.useQuery();
  const isAdmin = me.data?.role === "admin";

  return (
    <SiteLayout>
      <PageHeading
        eyebrow="RESULTS"
        title="설문 결과 통계"
        desc="이수자 설문의 문항별 집계와 비율입니다. 교육을 선택하면 해당 교육의 결과만 볼 수 있습니다."
      />
      <div className="container">
        <div className="flex flex-wrap items-center gap-4">
          <div className="w-full sm:w-96">
            <Select value={courseId} onValueChange={setCourseId}>
              <SelectTrigger aria-label="교육 선택">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 교육</SelectItem>
                {courses?.map(c => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.title} ({c.responseCount}명 응답)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="text-sm text-muted-foreground">
            총 응답 <b className="text-foreground text-lg font-display">{data?.responseCount ?? 0}</b>건
          </div>
        </div>

        {isLoading && (
          <div className="py-24 flex justify-center text-muted-foreground">
            <Loader2 className="animate-spin" />
          </div>
        )}

        {data && data.responseCount === 0 && !isLoading && (
          <p className="py-24 text-center text-muted-foreground">아직 제출된 설문 응답이 없습니다.</p>
        )}

        {data && data.responseCount > 0 && (
          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            {(data.items as Stat[]).map((s, i) => (
              <StatCard key={s.id} idx={i + 1} s={s} total={data.responseCount} isAdmin={isAdmin} />
            ))}
          </div>
        )}
      </div>
    </SiteLayout>
  );
}

function StatCard({ idx, s, total, isAdmin }: { idx: number; s: Stat; total: number; isAdmin: boolean }) {
  const sum = s.distribution.reduce((a, d) => a + d.count, 0);
  const rows = s.distribution.map(d => ({
    ...d,
    pct: s.type === "multiple" ? (total ? (d.count / total) * 100 : 0) : sum ? (d.count / sum) * 100 : 0,
  }));
  return (
    <section className="bg-card border border-border p-5 flex flex-col">
      <div className="text-xs tracking-widest text-[color:var(--gold)] font-bold">Q{idx}</div>
      <h3 className="font-display font-bold text-lg leading-snug mt-1">{s.text}</h3>
      <div className="text-xs text-muted-foreground mt-1">응답 {s.answerCount}건</div>

      {s.type === "rating" && (
        <div className="flex items-center gap-3 mt-4">
          <Star className="h-8 w-8 fill-[color:var(--gold)] text-[color:var(--gold)]" />
          <span className="font-display font-black text-4xl">{s.average.toFixed(2)}</span>
          <span className="text-muted-foreground">/ 5.00</span>
        </div>
      )}

      {s.type !== "text" && (
        <div className="mt-4 h-60">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={rows} layout="vertical" margin={{ left: 8, right: 56, top: 4, bottom: 4 }}>
              <CartesianGrid horizontal={false} stroke="var(--border)" />
              <XAxis type="number" hide allowDecimals={false} />
              <YAxis
                type="category"
                dataKey="label"
                width={90}
                tick={{ fontSize: 12, fill: "var(--foreground)" }}
                axisLine={false}
                tickLine={false}
              />
              <Bar dataKey="count" radius={[0, 2, 2, 0]} barSize={18}>
                {rows.map((_, k) => (
                  <Cell key={k} fill={k % 2 === 0 ? "var(--chart-1)" : "var(--chart-2)"} />
                ))}
                <LabelList
                  dataKey="count"
                  position="right"
                  formatter={(v: number) => (v ? `${v}명` : "")}
                  style={{ fontSize: 12 }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {s.type !== "text" && (
        <table className="w-full text-sm mt-2">
          <tbody>
            {rows.map(r => (
              <tr key={r.label} className="border-t border-border">
                <td className="py-1.5">{r.label}</td>
                <td className="py-1.5 text-right text-muted-foreground">{r.count}명</td>
                <td className="py-1.5 text-right font-bold w-16">{r.pct.toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {s.type === "text" && (
        <div className="mt-4">
          {isAdmin ? (
            s.texts.length ? (
              <ul className="space-y-2 max-h-72 overflow-auto pr-1">
                {s.texts.map((t, i) => (
                  <li key={i} className="text-sm bg-muted/60 p-3 whitespace-pre-line leading-relaxed">
                    {t}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">주관식 응답이 없습니다.</p>
            )
          ) : (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <MessageSquareText className="h-4 w-4" />
              주관식 응답 {s.answerCount}건 (원문은 관리자에게만 공개됩니다)
            </p>
          )}
        </div>
      )}
    </section>
  );
}
