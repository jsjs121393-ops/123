import CourseRow from "@/components/CourseRow";
import SiteLayout, { PageHeading } from "@/components/SiteLayout";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { useState } from "react";

const FILTERS = [
  { key: "all", label: "전체" },
  { key: "open", label: "모집중" },
  { key: "ongoing", label: "진행중" },
  { key: "completed", label: "종료" },
] as const;

export default function Courses() {
  const { data, isLoading } = trpc.course.list.useQuery();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["key"]>("all");

  const list = (data ?? []).filter(c => {
    if (filter === "all") return true;
    if (filter === "open") return c.status === "open";
    if (filter === "ongoing") return c.status === "ongoing" || c.status === "closed";
    return c.status === "completed";
  });

  return (
    <SiteLayout>
      <PageHeading
        eyebrow="COURSES"
        title="교육안내 · 신청"
        desc="교육을 선택해 일정과 내용, 신청 조건을 확인한 뒤 신청서를 제출하세요."
      />
      <div className="container">
        <div className="flex gap-2 flex-wrap" role="tablist" aria-label="교육 상태 필터">
          {FILTERS.map(f => (
            <button
              key={f.key}
              role="tab"
              aria-selected={filter === f.key}
              onClick={() => setFilter(f.key)}
              className={cn(
                "px-4 py-1.5 text-sm rounded-sm border transition-colors",
                filter === f.key
                  ? "bg-foreground text-background border-foreground"
                  : "border-border hover:border-foreground"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="mt-4 border-t border-foreground">
          {isLoading && (
            <div className="py-20 flex justify-center text-muted-foreground">
              <Loader2 className="animate-spin" />
            </div>
          )}
          {!isLoading && list.length === 0 && (
            <p className="py-20 text-center text-muted-foreground">해당하는 교육이 없습니다.</p>
          )}
          {list.map(c => (
            <CourseRow key={c.id} c={c} />
          ))}
        </div>
      </div>
    </SiteLayout>
  );
}
