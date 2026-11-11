import AdminGuard from "@/components/AdminGuard";
import SiteLayout, { PageHeading } from "@/components/SiteLayout";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { QUESTION_TYPE } from "@/lib/format";
import { trpc } from "@/lib/trpc";
import { ArrowDown, ArrowUp, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type QType = "rating" | "single" | "multiple" | "text";
type Form = { text: string; type: QType; optionsText: string; required: boolean };
const blank: Form = { text: "", type: "rating", optionsText: "", required: true };

export default function AdminSurvey() {
  return (
    <SiteLayout>
      <AdminGuard>
        <PageHeading
          eyebrow="ADMIN · SURVEY"
          title="설문 문항 관리"
          desc="모든 교육에 공통으로 적용되는 설문 문항을 작성·수정·삭제하고 순서를 정합니다. 문항을 삭제하면 해당 문항의 기존 응답도 함께 삭제됩니다."
        />
        <div className="container">
          <Manager />
        </div>
      </AdminGuard>
    </SiteLayout>
  );
}

function Manager() {
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.admin.questions.useQuery();
  const [editing, setEditing] = useState<{ id: number | null; form: Form } | null>(null);

  const refresh = () => {
    utils.admin.questions.invalidate();
    utils.survey.questions.invalidate();
    utils.stats.get.invalidate();
  };
  const create = trpc.admin.createQuestion.useMutation({
    onSuccess: () => {
      toast.success("문항을 추가했습니다.");
      setEditing(null);
      refresh();
    },
    onError: e => toast.error(e.message),
  });
  const update = trpc.admin.updateQuestion.useMutation({
    onSuccess: () => {
      toast.success("문항을 수정했습니다.");
      setEditing(null);
      refresh();
    },
    onError: e => toast.error(e.message),
  });
  const remove = trpc.admin.deleteQuestion.useMutation({
    onSuccess: () => {
      toast.success("문항을 삭제했습니다.");
      refresh();
    },
    onError: e => toast.error(e.message),
  });
  const move = trpc.admin.moveQuestion.useMutation({
    onSuccess: refresh,
    onError: e => toast.error(e.message),
  });

  const save = () => {
    if (!editing) return;
    const f = editing.form;
    const options = f.optionsText
      .split("\n")
      .map(s => s.trim())
      .filter(Boolean);
    const payload = { text: f.text, type: f.type, options, required: f.required };
    if (editing.id) update.mutate({ id: editing.id, data: payload });
    else create.mutate(payload);
  };

  const needsOptions = editing?.form.type === "single" || editing?.form.type === "multiple";

  return (
    <div>
      <div className="flex justify-between items-center gap-3">
        <p className="text-sm text-muted-foreground">문항 {data?.length ?? 0}개</p>
        <Button onClick={() => setEditing({ id: null, form: blank })}>
          <Plus className="h-4 w-4" /> 문항 추가
        </Button>
      </div>

      <div className="mt-4 border-t border-foreground">
        {isLoading && (
          <div className="py-16 flex justify-center">
            <Loader2 className="animate-spin" />
          </div>
        )}
        {!isLoading && !data?.length && (
          <p className="py-16 text-center text-muted-foreground">등록된 문항이 없습니다.</p>
        )}
        {data?.map((q, i) => (
          <div key={q.id} className="py-4 border-b border-border flex gap-4 items-start">
            <div className="font-display font-black text-2xl text-[color:var(--gold)] w-10 shrink-0">
              {String(i + 1).padStart(2, "0")}
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-medium leading-snug">{q.text}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {QUESTION_TYPE[q.type]} · {q.required ? "필수" : "선택"}
                {q.options.length > 0 && ` · ${q.options.join(" / ")}`}
              </div>
            </div>
            <div className="flex items-center shrink-0">
              <Button variant="ghost" size="icon" aria-label="위로" disabled={i === 0} onClick={() => move.mutate({ id: q.id, dir: "up" })}>
                <ArrowUp className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label="아래로"
                disabled={i === (data?.length ?? 0) - 1}
                onClick={() => move.mutate({ id: q.id, dir: "down" })}
              >
                <ArrowDown className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label="수정"
                onClick={() =>
                  setEditing({
                    id: q.id,
                    form: { text: q.text, type: q.type, optionsText: q.options.join("\n"), required: q.required },
                  })
                }
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label="삭제"
                onClick={() => {
                  if (confirm("이 문항과 기존 응답을 삭제할까요? 되돌릴 수 없습니다.")) remove.mutate({ id: q.id });
                }}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={!!editing} onOpenChange={o => !o && setEditing(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display">{editing?.id ? "문항 수정" : "문항 추가"}</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="grid gap-4">
              <div className="space-y-1.5">
                <Label>문항 내용</Label>
                <Input
                  value={editing.form.text}
                  maxLength={500}
                  onChange={e => setEditing(s => s && { ...s, form: { ...s.form, text: e.target.value } })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>응답 형식</Label>
                <Select
                  value={editing.form.type}
                  onValueChange={v => setEditing(s => s && { ...s, form: { ...s.form, type: v as QType } })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(QUESTION_TYPE).map(([k, v]) => (
                      <SelectItem key={k} value={k}>
                        {v}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {needsOptions && (
                <div className="space-y-1.5">
                  <Label>선택지 (한 줄에 하나, 2개 이상)</Label>
                  <Textarea
                    rows={5}
                    value={editing.form.optionsText}
                    onChange={e => setEditing(s => s && { ...s, form: { ...s.form, optionsText: e.target.value } })}
                  />
                </div>
              )}
              <label className="flex items-center gap-3 text-sm">
                <Switch
                  checked={editing.form.required}
                  onCheckedChange={v => setEditing(s => s && { ...s, form: { ...s.form, required: v } })}
                />
                필수 응답
              </label>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>
              취소
            </Button>
            <Button onClick={save} disabled={create.isPending || update.isPending}>
              {(create.isPending || update.isPending) && <Loader2 className="animate-spin" />}
              저장
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
