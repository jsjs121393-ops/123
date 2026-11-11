export const LOGO_FULL = "/assets/nephtys-logo.png";
export const EMBLEM = "/assets/nephtys-emblem.png";
export const SLOGAN = "카카오톡 국제사회의 평화·번영·정의를 위해";

export const COURSE_STATUS: Record<
  string,
  { label: string; tone: "gold" | "ink" | "muted" | "outline" }
> = {
  draft: { label: "준비중(비공개)", tone: "outline" },
  open: { label: "모집중", tone: "gold" },
  closed: { label: "모집마감", tone: "muted" },
  ongoing: { label: "교육 진행중", tone: "ink" },
  completed: { label: "교육 종료", tone: "muted" },
};

export const APP_STATUS: Record<string, string> = {
  pending: "승인 대기",
  approved: "승인",
  rejected: "반려",
  completed: "이수",
};

export const QUESTION_TYPE: Record<string, string> = {
  rating: "별점 (1~5)",
  single: "단일 선택",
  multiple: "복수 선택",
  text: "주관식",
};

const dateFmt = new Intl.DateTimeFormat("ko-KR", {
  year: "numeric",
  month: "long",
  day: "numeric",
  weekday: "short",
});
const dateTimeFmt = new Intl.DateTimeFormat("ko-KR", {
  year: "numeric",
  month: "long",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

export const fmtDate = (d: Date | string) => dateFmt.format(new Date(d));
export const fmtDateTime = (d: Date | string) => dateTimeFmt.format(new Date(d));

/** <input type="datetime-local"> 값 변환 */
export function toLocalInput(d: Date | string) {
  const x = new Date(d);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}T${pad(x.getHours())}:${pad(x.getMinutes())}`;
}
