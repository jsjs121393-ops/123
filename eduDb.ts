import { and, asc, desc, eq, inArray, ne, sql } from "drizzle-orm";
import {
  applications,
  courses,
  surveyAnswers,
  surveyQuestions,
  surveyResponses,
  users,
  type InsertCourse,
} from "../drizzle/schema";
import { getDb } from "./db";

async function requireDb() {
  const db = await getDb();
  if (!db) throw new Error("데이터베이스에 연결할 수 없습니다.");
  return db;
}

/* ───────────── 교육 과정 ───────────── */

/** 정원 계산에 포함되는 신청 수 (반려 제외) */
async function countsByCourse() {
  const db = await requireDb();
  const rows = await db
    .select({ courseId: applications.courseId, n: sql<number>`count(*)` })
    .from(applications)
    .where(ne(applications.status, "rejected"))
    .groupBy(applications.courseId);
  return new Map(rows.map(r => [r.courseId, Number(r.n)]));
}

export async function listCourses(opts: { includeDraft: boolean }) {
  const db = await requireDb();
  const rows = opts.includeDraft
    ? await db.select().from(courses).orderBy(desc(courses.startAt))
    : await db
        .select()
        .from(courses)
        .where(ne(courses.status, "draft"))
        .orderBy(desc(courses.startAt));
  const counts = await countsByCourse();
  return rows.map(c => ({ ...c, applicantCount: counts.get(c.id) ?? 0 }));
}

export async function getCourse(id: number, opts: { includeDraft: boolean }) {
  const db = await requireDb();
  const [c] = await db.select().from(courses).where(eq(courses.id, id)).limit(1);
  if (!c) return null;
  if (c.status === "draft" && !opts.includeDraft) return null;
  const counts = await countsByCourse();
  return { ...c, applicantCount: counts.get(c.id) ?? 0 };
}

export async function createCourse(values: InsertCourse) {
  const db = await requireDb();
  const [r] = await db.insert(courses).values(values);
  return Number((r as { insertId: number }).insertId);
}

export async function updateCourse(id: number, values: Partial<InsertCourse>) {
  const db = await requireDb();
  await db.update(courses).set(values).where(eq(courses.id, id));
}

export async function deleteCourse(id: number) {
  const db = await requireDb();
  const resp = await db
    .select({ id: surveyResponses.id })
    .from(surveyResponses)
    .where(eq(surveyResponses.courseId, id));
  if (resp.length) {
    await db.delete(surveyAnswers).where(
      inArray(
        surveyAnswers.responseId,
        resp.map(r => r.id)
      )
    );
  }
  await db.delete(surveyResponses).where(eq(surveyResponses.courseId, id));
  await db.delete(applications).where(eq(applications.courseId, id));
  await db.delete(courses).where(eq(courses.id, id));
}

/* ───────────── 신청 ───────────── */

const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
function makeCode() {
  let s = "NP-";
  for (let i = 0; i < 6; i++) s += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  return s;
}

export type ApplyInput = {
  courseId: number;
  applicantName: string;
  kakaoNick: string;
  affiliation: string;
  contact: string;
  motivation?: string;
};

export async function submitApplication(input: ApplyInput) {
  const db = await requireDb();
  const course = await getCourse(input.courseId, { includeDraft: false });
  if (!course) return { ok: false as const, reason: "존재하지 않는 교육입니다." };
  if (course.status !== "open") return { ok: false as const, reason: "현재 모집 중인 교육이 아닙니다." };
  if (new Date() > course.applyDeadline)
    return { ok: false as const, reason: "신청 기간이 마감되었습니다." };
  if (course.applicantCount >= course.capacity)
    return { ok: false as const, reason: "정원이 모두 찼습니다." };

  // 중복 신청 방지 (같은 교육 + 같은 카카오톡 닉네임)
  const [dup] = await db
    .select({ id: applications.id })
    .from(applications)
    .where(
      and(
        eq(applications.courseId, input.courseId),
        eq(applications.kakaoNick, input.kakaoNick),
        ne(applications.status, "rejected")
      )
    )
    .limit(1);
  if (dup) return { ok: false as const, reason: "이미 해당 교육에 신청하셨습니다." };

  for (let attempt = 0; attempt < 5; attempt++) {
    const code = makeCode();
    try {
      await db.insert(applications).values({ ...input, code, status: "pending" });
      return { ok: true as const, code, courseTitle: course.title };
    } catch (e: unknown) {
      if (!String((e as Error)?.message).includes("Duplicate")) throw e;
    }
  }
  throw new Error("신청번호 생성에 실패했습니다. 다시 시도해 주세요.");
}

export async function listApplications(courseId?: number) {
  const db = await requireDb();
  const q = db
    .select({
      id: applications.id,
      courseId: applications.courseId,
      courseTitle: courses.title,
      code: applications.code,
      applicantName: applications.applicantName,
      kakaoNick: applications.kakaoNick,
      affiliation: applications.affiliation,
      contact: applications.contact,
      motivation: applications.motivation,
      status: applications.status,
      createdAt: applications.createdAt,
    })
    .from(applications)
    .leftJoin(courses, eq(courses.id, applications.courseId));
  const rows = courseId ? await q.where(eq(applications.courseId, courseId)) : await q;
  return rows.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export async function setApplicationStatus(
  id: number,
  status: "pending" | "approved" | "rejected" | "completed"
) {
  const db = await requireDb();
  await db.update(applications).set({ status }).where(eq(applications.id, id));
}

export async function deleteApplication(id: number) {
  const db = await requireDb();
  const resp = await db
    .select({ id: surveyResponses.id })
    .from(surveyResponses)
    .where(eq(surveyResponses.applicationId, id));
  if (resp.length) {
    await db.delete(surveyAnswers).where(
      inArray(
        surveyAnswers.responseId,
        resp.map(r => r.id)
      )
    );
    await db.delete(surveyResponses).where(eq(surveyResponses.applicationId, id));
  }
  await db.delete(applications).where(eq(applications.id, id));
}

/** 승인된 신청을 모두 '이수'로 처리 */
export async function completeApprovedApplications(courseId: number) {
  const db = await requireDb();
  await db
    .update(applications)
    .set({ status: "completed" })
    .where(and(eq(applications.courseId, courseId), eq(applications.status, "approved")));
}

/* ───────────── 설문 문항 ───────────── */

export async function listQuestions() {
  const db = await requireDb();
  return db
    .select()
    .from(surveyQuestions)
    .orderBy(asc(surveyQuestions.orderIndex), asc(surveyQuestions.id));
}

export function parseOptions(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v.map(String) : [];
  } catch {
    return [];
  }
}

export async function createQuestion(v: {
  text: string;
  type: "rating" | "single" | "multiple" | "text";
  options: string[];
  required: boolean;
}) {
  const db = await requireDb();
  const all = await listQuestions();
  const next = all.length ? Math.max(...all.map(q => q.orderIndex)) + 1 : 1;
  await db.insert(surveyQuestions).values({
    text: v.text,
    type: v.type,
    options: v.type === "single" || v.type === "multiple" ? JSON.stringify(v.options) : null,
    required: v.required,
    orderIndex: next,
  });
}

export async function updateQuestion(
  id: number,
  v: {
    text: string;
    type: "rating" | "single" | "multiple" | "text";
    options: string[];
    required: boolean;
  }
) {
  const db = await requireDb();
  await db
    .update(surveyQuestions)
    .set({
      text: v.text,
      type: v.type,
      options: v.type === "single" || v.type === "multiple" ? JSON.stringify(v.options) : null,
      required: v.required,
    })
    .where(eq(surveyQuestions.id, id));
}

export async function deleteQuestion(id: number) {
  const db = await requireDb();
  await db.delete(surveyAnswers).where(eq(surveyAnswers.questionId, id));
  await db.delete(surveyQuestions).where(eq(surveyQuestions.id, id));
}

/** 문항 순서 이동 (인접 문항과 orderIndex 교환) */
export async function moveQuestion(id: number, dir: "up" | "down") {
  const db = await requireDb();
  const all = await listQuestions();
  const idx = all.findIndex(q => q.id === id);
  const swap = dir === "up" ? idx - 1 : idx + 1;
  if (idx < 0 || swap < 0 || swap >= all.length) return;
  // 순서값을 0..n-1 로 재정렬한 뒤 교환
  const order = all.map(q => q.id);
  [order[idx], order[swap]] = [order[swap], order[idx]];
  for (let i = 0; i < order.length; i++) {
    await db.update(surveyQuestions).set({ orderIndex: i + 1 }).where(eq(surveyQuestions.id, order[i]));
  }
}

/* ───────────── 설문 응답 ───────────── */

export async function findEligibleApplication(code: string) {
  const db = await requireDb();
  const [row] = await db
    .select({
      applicationId: applications.id,
      applicantName: applications.applicantName,
      appStatus: applications.status,
      courseId: courses.id,
      courseTitle: courses.title,
      courseStatus: courses.status,
    })
    .from(applications)
    .innerJoin(courses, eq(courses.id, applications.courseId))
    .where(eq(applications.code, code.trim().toUpperCase()))
    .limit(1);
  if (!row) return { ok: false as const, reason: "신청번호를 찾을 수 없습니다." };
  if (row.appStatus !== "approved" && row.appStatus !== "completed")
    return { ok: false as const, reason: "승인되지 않은 신청입니다. 교육 승인 후 참여할 수 있습니다." };
  if (row.courseStatus !== "completed")
    return { ok: false as const, reason: "아직 교육이 종료되지 않았습니다. 교육 종료 후 설문에 참여해 주세요." };
  const [done] = await db
    .select({ id: surveyResponses.id })
    .from(surveyResponses)
    .where(eq(surveyResponses.applicationId, row.applicationId))
    .limit(1);
  if (done) return { ok: false as const, reason: "이미 설문에 참여하셨습니다. 감사합니다." };
  return { ok: true as const, ...row };
}

export async function submitSurvey(
  applicationId: number,
  courseId: number,
  answers: { questionId: number; value: string }[]
) {
  const db = await requireDb();
  const [r] = await db.insert(surveyResponses).values({ applicationId, courseId });
  const responseId = Number((r as { insertId: number }).insertId);
  if (answers.length) {
    await db.insert(surveyAnswers).values(answers.map(a => ({ ...a, responseId })));
  }
}

/* ───────────── 통계 ───────────── */

export async function responseCounts() {
  const db = await requireDb();
  const rows = await db
    .select({ courseId: surveyResponses.courseId, n: sql<number>`count(*)` })
    .from(surveyResponses)
    .groupBy(surveyResponses.courseId);
  return new Map(rows.map(r => [r.courseId, Number(r.n)]));
}

export async function surveyStats(courseId: number | null, includeText: boolean) {
  const db = await requireDb();
  const questions = await listQuestions();
  const respWhere = courseId ? eq(surveyResponses.courseId, courseId) : undefined;
  const responses = respWhere
    ? await db.select({ id: surveyResponses.id }).from(surveyResponses).where(respWhere)
    : await db.select({ id: surveyResponses.id }).from(surveyResponses);
  const ids = responses.map(r => r.id);
  const answers = ids.length
    ? await db.select().from(surveyAnswers).where(inArray(surveyAnswers.responseId, ids))
    : [];

  const items = questions.map(q => {
    const qa = answers.filter(a => a.questionId === q.id);
    const base = { id: q.id, text: q.text, type: q.type, answerCount: qa.length };
    if (q.type === "rating") {
      const dist = [1, 2, 3, 4, 5].map(s => ({
        label: `${s}점`,
        count: qa.filter(a => Number(a.value) === s).length,
      }));
      const nums = qa.map(a => Number(a.value)).filter(n => n >= 1 && n <= 5);
      const average = nums.length ? nums.reduce((s, n) => s + n, 0) / nums.length : 0;
      return { ...base, average, distribution: dist, texts: [] as string[] };
    }
    if (q.type === "single" || q.type === "multiple") {
      const opts = parseOptions(q.options);
      const counts = new Map<string, number>(opts.map(o => [o, 0]));
      for (const a of qa) {
        let vals: string[] = [];
        if (q.type === "multiple") {
          try {
            vals = JSON.parse(a.value);
          } catch {
            vals = [];
          }
        } else vals = [a.value];
        for (const v of vals) counts.set(v, (counts.get(v) ?? 0) + 1);
      }
      return {
        ...base,
        average: 0,
        distribution: Array.from(counts, ([label, count]) => ({ label, count })),
        texts: [] as string[],
      };
    }
    return {
      ...base,
      average: 0,
      distribution: [] as { label: string; count: number }[],
      texts: includeText ? qa.map(a => a.value) : [],
    };
  });
  return { responseCount: ids.length, items };
}

/* ───────────── 사용자(관리자 지정) ───────────── */

export async function listUsers() {
  const db = await requireDb();
  return db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      lastSignedIn: users.lastSignedIn,
    })
    .from(users)
    .orderBy(desc(users.lastSignedIn));
}

export async function setUserRole(id: number, role: "user" | "admin") {
  const db = await requireDb();
  await db.update(users).set({ role }).where(eq(users.id, id));
}

/* ───────────── 기본 설문 문항 시드 (비어 있을 때 1회) ───────────── */

export async function seedDefaultQuestions() {
  const db = await requireDb();
  const [{ n }] = await db.select({ n: sql<number>`count(*)` }).from(surveyQuestions);
  if (Number(n) > 0) return false;
  const defaults: {
    text: string;
    type: "rating" | "single" | "multiple" | "text";
    options?: string[];
    required: boolean;
  }[] = [
    { text: "교육 내용에 전반적으로 만족하셨나요?", type: "rating", required: true },
    { text: "강사의 전달력과 진행 방식은 어땠나요?", type: "rating", required: true },
    { text: "교육 내용은 실제 활동에 도움이 될 것 같나요?", type: "rating", required: true },
    {
      text: "교육 난이도는 어땠나요?",
      type: "single",
      options: ["매우 쉬움", "쉬움", "적당함", "어려움", "매우 어려움"],
      required: true,
    },
    {
      text: "이 교육을 알게 된 경로를 모두 선택해 주세요.",
      type: "multiple",
      options: ["공지사항", "지인 추천", "카카오톡 방", "교육처 홍보", "기타"],
      required: false,
    },
    { text: "개선했으면 하는 점이나 바라는 점을 자유롭게 적어 주세요.", type: "text", required: false },
  ];
  await db.insert(surveyQuestions).values(
    defaults.map((d, i) => ({
      text: d.text,
      type: d.type,
      options: d.options ? JSON.stringify(d.options) : null,
      required: d.required,
      orderIndex: i + 1,
    }))
  );
  return true;
}
