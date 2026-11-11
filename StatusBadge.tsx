import { COURSE_STATUS } from "@/lib/format";
import { cn } from "@/lib/utils";

const TONE: Record<string, string> = {
  gold: "bg-[color:var(--gold)] text-white",
  ink: "bg-[color:var(--ink)] text-[#f6f2f0]",
  muted: "bg-secondary text-secondary-foreground",
  outline: "border border-border text-muted-foreground",
};

export default function StatusBadge({ status }: { status: string }) {
  const s = COURSE_STATUS[status] ?? { label: status, tone: "muted" as const };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-sm px-2 py-0.5 text-xs font-bold tracking-wide whitespace-nowrap",
        TONE[s.tone]
      )}
    >
      {s.label}
    </span>
  );
}
