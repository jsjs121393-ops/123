import StatusBadge from "@/components/StatusBadge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { COURSE_STATUS, fmtDate, toLocalInput } from "@/lib/format";
import { trpc } from "@/lib/trpc";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type FormState = {
  title: string;
  category: string;
  summary: string;
  description: string;
  instructor: string;
  location: string;
  requirements: string;
  startAt: string;
  endAt: string;
  applyDeadline: string;
  capacity: string;
  status: "draft" | "open" | "closed" | "ongoing" | "completed";
};

const emptyForm = (): FormState => {
  const now = Date.now();
  const day = 86400000;
  return {
    title: "",
    category: "일반",
    summary: "",
    description: "",
    instructor: "",
    location: "",
    requirements: "",
    startAt: toLocalInput(new Date(now + 7 * day)),
    endAt: toLocalInput(new Date(now + 7 * day + 2 * 3600000)),
    applyDeadline: toLocalInput(new Date(now + 5 * day)),
    capacity: "30",
    status: "draft",
  };
};

export default function CourseManager() {
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.admin.courses.useQuery();
  const [editing, setEditing] = useState<{ id: number | null; form: FormState } | null>(null);
  const [deleting, setDeleting] = useState<{ id: number; title: string } | null>(null);

  const refresh = () => {
    utils.admin.courses.invalidate();
    utils.course.list.invalidate();
    utils.stats.courses.invalidate();
  };
  const create = trpc.admin.createCourse.useMutation({
    onSuccess: () => {
      toast.success("교육을 등록했습니다.");
      setEditing(null);
      refresh();
    },
    onError: e => toast.error(e.message),
  });
  const update = trpc.admin.updateCourse.useMutation({
    onSuccess: () => {
      toast.success("교육을 수정했습니다.");
      setEditing(null);
      refresh();
    },
    onError: e => toast.error(e.message),
  });
  const setStatus = trpc.admin.setCourseStatus.useMutation({
    onSuccess: () => {
      toast.success("교육 상태를 변경했습니다.");
      refresh();
    },
    onError: e => toast.error(e.message),
  });
  const remove = trpc.admin.deleteCourse.useMutation({
    onSuccess: () => {
      toast.success("교육을 삭제했습니다.");
      setDeleting(null);
      utils.admin.applications.invalidate();
      refresh();
    },
    onError: e => toast.error(e.message),
  });

  const save = () => {
    if (!editing) return;
    const f = editing.form;
    const payload = {
      title: f.title,
      category: f.category || "일반",
      summary: f.summary,
      description: f.description,
      instructor: f.instructor,
      location: f.location,
      requirements: f.requirements,
      startAt: new Date(f.startAt),
      endAt: new Date(f.endAt),
      applyDeadline: new Date(f.applyDeadline),
      capacity: Number(f.capacity),
      status: f.status,
    };
    if (Number.isNaN(payload.startAt.getTime()) || Number.isNaN(payload.endAt.getTime()) || Number.isNaN(payload.applyDeadline.getTime())) {
      toast.error("일정을 올바르게 입력해 주세요.");
      return;
    }
    if (!Number.isInteger(payload.capacity) || payload.capacity < 1) {
      toast.error("정원은 1 이상의 정수여야 합니다.");
      return;
    }
    if (editing.id) update.mutate({ id: editing.id, data: payload });
    else create.mutate(payload);
  };

  const set = (k: keyof FormState, v: string) =>
    setEditing(s => (s ? { ...s, form: { ...s.form, [k]: v } } : s));

  const busy = create.isPending || update.isPending;

  return (
    <div>
      <div className="flex justify-between items-center gap-3">
        <p className="text-sm text-muted-foreground">
          등록된 교육 {data?.length ?? 0}건 · 신청자에게는 '준비중(비공개)'을 제외한 교육만 보입니다.
        </p>
        <Button onClick={() => setEditing({ id: null, form: emptyForm() })}>
          <Plus className="h-4 w-4" /> 교육 등록
        </Button>
      </div>

      <div className="mt-4 border-t border-foreground">
        {isLoading && (
          <div className="py-16 flex justify-center">
            <Loader2 className="animate-spin" />
          </div>
        )}
        {!isLoading && !data?.length && (
          <p className="py-16 text-center text-muted-foreground">등록된 교육이 없습니다. '교육 등록'으로 첫 교육을 만들어 보세요.</p>
        )}
        {data?.map(c => (
          <div key={c.id} className="py-4 border-b border-border grid lg:grid-cols-[1fr_auto] gap-3 items-center">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <StatusBadge status={c.status} />
                <span className="text-xs text-muted-foreground">{c.category}</span>
              </div>
              <div className="font-display font-bold text-lg mt-1">{c.title}</div>
              <div className="text-sm text-muted-foreground mt-0.5">
                {fmtDate(c.startAt)} ~ {fmtDate(c.endAt)} · 신청 {c.applicantCount}/{c.capacity}명
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Select
                value={c.status}
                onValueChange={v => setStatus.mutate({ id: c.id, status: v as FormState["status"] })}
              >
                <SelectTrigger className="w-36" aria-label="교육 상태 변경">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(COURSE_STATUS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>
                      {v.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setEditing({
                    id: c.id,
                    form: {
                      title: c.title,
                      category: c.category,
                      summary: c.summary,
                      description: c.description,
                      instructor: c.instructor,
                      location: c.location,
                      requirements: c.requirements ?? "",
                      startAt: toLocalInput(c.startAt),
                      endAt: toLocalInput(c.endAt),
                      applyDeadline: toLocalInput(c.applyDeadline),
                      capacity: String(c.capacity),
                      status: c.status,
                    },
                  })
                }
              >
                <Pencil className="h-4 w-4" /> 수정
              </Button>
              <Button variant="outline" size="sm" onClick={() => setDeleting({ id: c.id, title: c.title })}>
                <Trash2 className="h-4 w-4 text-destructive" /> 삭제
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* 등록/수정 */}
      <Dialog open={!!editing} onOpenChange={o => !o && setEditing(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">{editing?.id ? "교육 수정" : "교육 등록"}</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="grid gap-4">
              <F label="교육명 *">
                <Input value={editing.form.title} onChange={e => set("title", e.target.value)} maxLength={200} />
              </F>
              <div className="grid sm:grid-cols-2 gap-4">
                <F label="분류">
                  <Input value={editing.form.category} onChange={e => set("category", e.target.value)} maxLength={60} />
                </F>
                <F label="상태">
                  <Select value={editing.form.status} onValueChange={v => set("status", v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(COURSE_STATUS).map(([k, v]) => (
                        <SelectItem key={k} value={k}>
                          {v.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </F>
              </div>
              <F label="한 줄 소개">
                <Input value={editing.form.summary} onChange={e => set("summary", e.target.value)} maxLength={300} />
              </F>
              <F label="교육 내용 *">
                <Textarea rows={5} value={editing.form.description} onChange={e => set("description", e.target.value)} />
              </F>
              <div className="grid sm:grid-cols-2 gap-4">
                <F label="강사">
                  <Input value={editing.form.instructor} onChange={e => set("instructor", e.target.value)} maxLength={100} />
                </F>
                <F label="장소">
                  <Input value={editing.form.location} onChange={e => set("location", e.target.value)} maxLength={200} />
                </F>
              </div>
              <div className="grid sm:grid-cols-3 gap-4">
                <F label="시작 일시">
                  <Input type="datetime-local" value={editing.form.startAt} onChange={e => set("startAt", e.target.value)} />
                </F>
                <F label="종료 일시">
                  <Input type="datetime-local" value={editing.form.endAt} onChange={e => set("endAt", e.target.value)} />
                </F>
                <F label="신청 마감">
                  <Input type="datetime-local" value={editing.form.applyDeadline} onChange={e => set("applyDeadline", e.target.value)} />
                </F>
              </div>
              <F label="정원 (명)">
                <Input type="number" min={1} value={editing.form.capacity} onChange={e => set("capacity", e.target.value)} />
              </F>
              <F label="신청 조건">
                <Textarea rows={3} value={editing.form.requirements} onChange={e => set("requirements", e.target.value)} />
              </F>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>
              취소
            </Button>
            <Button onClick={save} disabled={busy}>
              {busy && <Loader2 className="animate-spin" />}
              저장
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 삭제 확인 */}
      <AlertDialog open={!!deleting} onOpenChange={o => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>교육을 삭제할까요?</AlertDialogTitle>
            <AlertDialogDescription>
              '{deleting?.title}' 교육과 해당 교육의 신청 내역, 설문 응답이 모두 영구 삭제되며 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleting && remove.mutate({ id: deleting.id })}>삭제</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm">{label}</Label>
      {children}
    </div>
  );
}
