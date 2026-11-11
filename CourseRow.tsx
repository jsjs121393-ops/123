import StatusBadge from "@/components/StatusBadge";
import { fmtDate } from "@/lib/format";
import { ArrowRight, CalendarDays, MapPin, Users } from "lucide-react";
import { Link } from "wouter";

export type CourseRowData = {
  id: number;
  title: string;
  category: string;
  summary: string;
  instructor: string;
  location: string;
  startAt: Date;
  endAt: Date;
  capacity: number;
  applicantCount: number;
  status: string;
};

export default function CourseRow({ c }: { c: CourseRowData }) {
  const remain = Math.max(0, c.capacity - c.applicantCount);
  return (
    <Link
      href={`/courses/${c.id}`}
      className="group grid md:grid-cols-[1fr_auto] gap-4 items-center py-6 border-b border-border hover:bg-card/70 transition-colors px-2 -mx-2"
    >
      <div className="min-w-0">
        <div className="flex items-center gap-3 flex-wrap">
          <StatusBadge status={c.status} />
          <span className="text-xs tracking-widest text-muted-foreground">{c.category}</span>
        </div>
        <h3 className="font-display font-bold text-xl mt-2 group-hover:text-[color:var(--gold)] transition-colors">
          {c.title}
        </h3>
        {c.summary && <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{c.summary}</p>}
        <div className="flex flex-wrap gap-x-5 gap-y-1 mt-3 text-sm text-foreground/80">
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays className="h-4 w-4 text-[color:var(--gold)]" />
            {fmtDate(c.startAt)} ~ {fmtDate(c.endAt)}
          </span>
          {c.location && (
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-[color:var(--gold)]" />
              {c.location}
            </span>
          )}
          <span className="inline-flex items-center gap-1.5">
            <Users className="h-4 w-4 text-[color:var(--gold)]" />
            {c.applicantCount}/{c.capacity}명{c.status === "open" && ` (잔여 ${remain})`}
          </span>
        </div>
      </div>
      <div className="hidden md:flex items-center gap-2 text-sm font-bold">
        자세히 보기
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
      </div>
    </Link>
  );
}
