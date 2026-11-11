import { Button } from "@/components/ui/button";
import { fmtDateTime } from "@/lib/format";
import { trpc } from "@/lib/trpc";
import { Loader2, ShieldCheck, ShieldOff } from "lucide-react";
import { toast } from "sonner";

export default function UserManager() {
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.admin.users.useQuery();
  const setRole = trpc.admin.setUserRole.useMutation({
    onSuccess: () => {
      toast.success("권한을 변경했습니다.");
      utils.admin.users.invalidate();
    },
    onError: e => toast.error(e.message),
  });

  return (
    <div>
      <p className="text-sm text-muted-foreground leading-relaxed">
        사이트에 한 번이라도 로그인한 계정이 표시됩니다. 함께 일할 교육처 담당자가 먼저 로그인한 뒤, 여기서 관리자 권한을 부여하세요.
      </p>
      <div className="mt-4 border-t border-foreground">
        {isLoading && (
          <div className="py-10 flex justify-center">
            <Loader2 className="animate-spin" />
          </div>
        )}
        {data?.map(u => (
          <div key={u.id} className="py-3 border-b border-border flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="font-medium flex items-center gap-2">
                {u.name ?? "(이름 없음)"}
                {u.role === "admin" && (
                  <span className="text-[10px] font-bold tracking-widest bg-[color:var(--gold)] text-white px-1.5 py-0.5 rounded-sm">
                    ADMIN
                  </span>
                )}
              </div>
              <div className="text-xs text-muted-foreground">
                {u.email ?? "-"} · 최근 로그인 {fmtDateTime(u.lastSignedIn)}
              </div>
            </div>
            {u.role === "admin" ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRole.mutate({ id: u.id, role: "user" })}
              >
                <ShieldOff className="h-4 w-4" /> 권한 해제
              </Button>
            ) : (
              <Button size="sm" onClick={() => setRole.mutate({ id: u.id, role: "admin" })}>
                <ShieldCheck className="h-4 w-4" /> 관리자 지정
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
