import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { APP_STATUS, fmtDateTime } from "@/lib/format";
import { trpc } from "@/lib/trpc";
import { Bell, CheckCheck, Loader2, RefreshCw, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function ApplicationManager() {
  const utils = trpc.useUtils();
  const [courseId, setCourseId] = useState("all");
  const { data: courses } = trpc.admin.courses.useQuery();
  const { data, isLoading, isFetching, refetch } = trpc.admin.applications.useQuery({
    courseId: courseId === "all" ? undefined : Number(courseId),
  }, { refetchInterval: 30_000 });

  const refresh = () => {
    utils.admin.applications.invalidate();
    utils.admin.courses.invalidate();
    utils.course.list.invalidate();
  };
  const setStatus = trpc.admin.setApplicationStatus.useMutation({
    onSuccess: refresh,
    onError: e => toast.error(e.message),
  });
  const remove = trpc.admin.deleteApplication.useMutation({
    onSuccess: () => {
      toast.success("신청 내역을 삭제했습니다.");
      refresh();
    },
    onError: e => toast.error(e.message),
  });
  const completeAll = trpc.admin.completeApproved.useMutation({
    onSuccess: () => {
      toast.success("승인된 신청을 모두 '이수'로 처리했습니다.");
      refresh();
    },
    onError: e => toast.error(e.message),
  });

  const counts = (data ?? []).reduce<Record<string, number>>((m, a) => {
    m[a.status] = (m[a.status] ?? 0) + 1;
    return m;
  }, {});
  const pendingCount = counts.pending ?? 0;
  const approvedCount = counts.approved ?? 0;
  const completedCount = counts.completed ?? 0;
  const rejectedCount = counts.rejected ?? 0;

  return (
    <div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <Summary label="새 승인 대기" value={pendingCount} emphasis={pendingCount > 0} icon={<Bell className="h-4 w-4" />} />
        <Summary label="승인" value={approvedCount} icon={<CheckCheck className="h-4 w-4" />} />
        <Summary label="이수" value={completedCount} />
        <Summary label="반려" value={rejectedCount} />
      </div>
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div className="w-full sm:w-80">
          <Select value={courseId} onValueChange={setCourseId}>
            <SelectTrigger aria-label="교육 선택">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체 교육</SelectItem>
              {courses?.map(c => (
                <SelectItem key={c.id} value={String(c.id)}>
                  {c.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span>30초마다 자동 확인</span>
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={isFetching ? "h-4 w-4 animate-spin" : "h-4 w-4"} /> 새로고침
          </Button>
          {courseId !== "all" && (
            <Button
              variant="outline"
              size="sm"
              disabled={completeAll.isPending}
              onClick={() => completeAll.mutate({ courseId: Number(courseId) })}
            >
              <CheckCheck className="h-4 w-4" /> 승인자 전원 이수 처리
            </Button>
          )}
        </div>
      </div>

      <div className="mt-4 border border-border bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>신청번호</TableHead>
              <TableHead>이름 / 카카오톡</TableHead>
              <TableHead>교육</TableHead>
              <TableHead>소속·연락처</TableHead>
              <TableHead>신청일</TableHead>
              <TableHead className="w-36">상태</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10">
                  <Loader2 className="animate-spin inline" />
                </TableCell>
              </TableRow>
            )}
            {!isLoading && !data?.length && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                  신청 내역이 없습니다.
                </TableCell>
              </TableRow>
            )}
            {data?.map(a => (
              <TableRow key={a.id}>
                <TableCell className="font-mono text-xs">{a.code}</TableCell>
                <TableCell>
                  <div className="font-medium">{a.applicantName}</div>
                  <div className="text-xs text-muted-foreground">{a.kakaoNick}</div>
                </TableCell>
                <TableCell className="max-w-48 truncate">{a.courseTitle}</TableCell>
                <TableCell className="text-sm">
                  <div>{a.affiliation || "-"}</div>
                  <div className="text-xs text-muted-foreground">{a.contact}</div>
                  {a.motivation && (
                    <div className="text-xs text-muted-foreground mt-1 max-w-56 line-clamp-2" title={a.motivation}>
                      동기: {a.motivation}
                    </div>
                  )}
                </TableCell>
                <TableCell className="text-xs whitespace-nowrap">{fmtDateTime(a.createdAt)}</TableCell>
                <TableCell>
                  <Select
                    value={a.status}
                    onValueChange={v =>
                      setStatus.mutate({ id: a.id, status: v as "pending" | "approved" | "rejected" | "completed" })
                    }
                  >
                    <SelectTrigger className="h-8" aria-label="신청 상태">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(APP_STATUS).map(([k, v]) => (
                        <SelectItem key={k} value={k}>
                          {v}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="신청 삭제"
                    onClick={() => {
                      if (confirm(`${a.applicantName}님의 신청을 삭제할까요? 설문 응답도 함께 삭제됩니다.`))
                        remove.mutate({ id: a.id });
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function Summary({
  label,
  value,
  icon,
  emphasis,
}: {
  label: string;
  value: number;
  icon?: React.ReactNode;
  emphasis?: boolean;
}) {
  return (
    <div className={`border p-4 bg-card ${emphasis ? "border-[color:var(--gold)] ring-1 ring-[color:var(--gold)]" : "border-border"}`}>
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="font-display font-black text-3xl mt-1">{value}</div>
      {emphasis && <div className="text-[11px] text-[color:var(--gold)] mt-1">처리가 필요한 신청</div>}
    </div>
  );
}
