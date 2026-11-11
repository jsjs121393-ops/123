import { COOKIE_NAME } from "@shared/const";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  ADMIN_SESSION_COOKIE,
  ADMIN_USERNAME,
  adminCookieClearOptions,
  adminCookieOptions,
  createAdminSession,
  verifyAdminPassword,
} from "./_core/adminAuth";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, publicProcedure, router } from "./_core/trpc";
import * as edu from "./eduDb";

const courseStatus = z.enum(["draft", "open", "closed", "ongoing", "completed"]);
const appStatus = z.enum(["pending", "approved", "rejected", "completed"]);

const courseInput = z.object({
  title: z.string().trim().min(1, "교육명을 입력해 주세요.").max(200),
  category: z.string().trim().max(60).default("일반"),
  summary: z.string().trim().max(300).default(""),
  description: z.string().trim().min(1, "교육 내용을 입력해 주세요.").max(10000),
  instructor: z.string().trim().max(100).default(""),
  location: z.string().trim().max(200).default(""),
  requirements: z.string().trim().max(3000).default(""),
  startAt: z.coerce.date(),
  endAt: z.coerce.date(),
  applyDeadline: z.coerce.date(),
  capacity: z.number().int().min(1).max(100000),
  status: courseStatus,
});

const questionInput = z
  .object({
    text: z.string().trim().min(1, "문항 내용을 입력해 주세요.").max(500),
    type: z.enum(["rating", "single", "multiple", "text"]),
    options: z.array(z.string().trim().min(1).max(100)).max(20).default([]),
    required: z.boolean(),
  })
  .refine(v => !(v.type === "single" || v.type === "multiple") || v.options.length >= 2, {
    message: "선택형 문항은 선택지가 2개 이상 필요합니다.",
  });

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    adminLogin: publicProcedure
      .input(
        z.object({
          username: z.string().trim().min(1).max(100),
          password: z.string().min(1).max(16_384),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (input.username !== ADMIN_USERNAME || !verifyAdminPassword(input.password)) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "관리자 아이디 또는 비밀번호가 올바르지 않습니다.",
          });
        }
        const token = await createAdminSession();
        ctx.res.cookie(ADMIN_SESSION_COOKIE, token, adminCookieOptions());
        return { success: true, name: "네프티스 관리자" } as const;
      }),
    adminLogout: publicProcedure.mutation(({ ctx }) => {
      ctx.res.clearCookie(ADMIN_SESSION_COOKIE, adminCookieClearOptions());
      return { success: true } as const;
    }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      ctx.res.clearCookie(ADMIN_SESSION_COOKIE, adminCookieClearOptions());
      return {
        success: true,
      } as const;
    }),
  }),

  /* ── 공개: 교육 목록/상세/신청 ── */
  course: router({
    list: publicProcedure.query(() => edu.listCourses({ includeDraft: false })),
    get: publicProcedure.input(z.object({ id: z.number().int() })).query(async ({ input }) => {
      const c = await edu.getCourse(input.id, { includeDraft: false });
      if (!c) throw new TRPCError({ code: "NOT_FOUND", message: "교육을 찾을 수 없습니다." });
      return c;
    }),
    submitApplication: publicProcedure
      .input(
        z.object({
          courseId: z.number().int(),
          applicantName: z.string().trim().min(1, "이름을 입력해 주세요.").max(100),
          kakaoNick: z.string().trim().min(1, "카카오톡 닉네임을 입력해 주세요.").max(100),
          affiliation: z.string().trim().max(150).default(""),
          contact: z.string().trim().max(150).default(""),
          motivation: z.string().trim().max(2000).optional(),
        })
      )
      .mutation(async ({ input }) => {
        const r = await edu.submitApplication(input);
        if (!r.ok) throw new TRPCError({ code: "BAD_REQUEST", message: r.reason });
        return { code: r.code, courseTitle: r.courseTitle };
      }),
  }),

  /* ── 공개: 설문 응답 ── */
  survey: router({
    questions: publicProcedure.query(async () => {
      const qs = await edu.listQuestions();
      return qs.map(q => ({ ...q, options: edu.parseOptions(q.options) }));
    }),
    verify: publicProcedure
      .input(z.object({ code: z.string().trim().min(1).max(32) }))
      .mutation(async ({ input }) => {
        const r = await edu.findEligibleApplication(input.code);
        if (!r.ok) throw new TRPCError({ code: "BAD_REQUEST", message: r.reason });
        return {
          applicantName: r.applicantName,
          courseTitle: r.courseTitle,
        };
      }),
    submit: publicProcedure
      .input(
        z.object({
          code: z.string().trim().min(1).max(32),
          answers: z.array(z.object({ questionId: z.number().int(), value: z.string().max(3000) })),
        })
      )
      .mutation(async ({ input }) => {
        const r = await edu.findEligibleApplication(input.code);
        if (!r.ok) throw new TRPCError({ code: "BAD_REQUEST", message: r.reason });
        const questions = await edu.listQuestions();
        const byId = new Map(questions.map(q => [q.id, q]));
        const cleaned: { questionId: number; value: string }[] = [];
        for (const q of questions) {
          const a = input.answers.find(x => x.questionId === q.id);
          const raw = a?.value?.trim() ?? "";
          let empty = raw === "";
          if (q.type === "multiple" && raw) {
            try {
              empty = JSON.parse(raw).length === 0;
            } catch {
              empty = true;
            }
          }
          if (empty) {
            if (q.required)
              throw new TRPCError({ code: "BAD_REQUEST", message: `필수 문항에 답해 주세요: ${q.text}` });
            continue;
          }
          if (q.type === "rating") {
            const n = Number(raw);
            if (!Number.isInteger(n) || n < 1 || n > 5)
              throw new TRPCError({ code: "BAD_REQUEST", message: "별점은 1~5 사이여야 합니다." });
          }
          cleaned.push({ questionId: q.id, value: raw });
        }
        void byId;
        try {
          await edu.submitSurvey(r.applicationId, r.courseId, cleaned);
        } catch (e) {
          if (String((e as Error)?.message).includes("Duplicate"))
            throw new TRPCError({ code: "BAD_REQUEST", message: "이미 설문에 참여하셨습니다." });
          throw e;
        }
        return { success: true } as const;
      }),
  }),

  /* ── 공개: 결과 통계 (주관식 원문은 관리자에게만 제공) ── */
  stats: router({
    courses: publicProcedure.query(async () => {
      const [list, counts] = await Promise.all([
        edu.listCourses({ includeDraft: false }),
        edu.responseCounts(),
      ]);
      return list.map(c => ({
        id: c.id,
        title: c.title,
        status: c.status,
        endAt: c.endAt,
        responseCount: counts.get(c.id) ?? 0,
      }));
    }),
    get: publicProcedure
      .input(z.object({ courseId: z.number().int().nullable() }))
      .query(({ input, ctx }) => edu.surveyStats(input.courseId, ctx.user?.role === "admin")),
  }),

  /* ── 관리자 전용 ── */
  admin: router({
    courses: adminProcedure.query(() => edu.listCourses({ includeDraft: true })),
    createCourse: adminProcedure.input(courseInput).mutation(async ({ input }) => {
      if (input.endAt < input.startAt)
        throw new TRPCError({ code: "BAD_REQUEST", message: "종료일이 시작일보다 빠릅니다." });
      const id = await edu.createCourse(input);
      return { id };
    }),
    updateCourse: adminProcedure
      .input(z.object({ id: z.number().int(), data: courseInput }))
      .mutation(async ({ input }) => {
        if (input.data.endAt < input.data.startAt)
          throw new TRPCError({ code: "BAD_REQUEST", message: "종료일이 시작일보다 빠릅니다." });
        await edu.updateCourse(input.id, input.data);
        return { success: true } as const;
      }),
    setCourseStatus: adminProcedure
      .input(z.object({ id: z.number().int(), status: courseStatus }))
      .mutation(async ({ input }) => {
        await edu.updateCourse(input.id, { status: input.status });
        return { success: true } as const;
      }),
    deleteCourse: adminProcedure
      .input(z.object({ id: z.number().int() }))
      .mutation(async ({ input }) => {
        await edu.deleteCourse(input.id);
        return { success: true } as const;
      }),

    applications: adminProcedure
      .input(z.object({ courseId: z.number().int().optional() }))
      .query(({ input }) => edu.listApplications(input.courseId)),
    setApplicationStatus: adminProcedure
      .input(z.object({ id: z.number().int(), status: appStatus }))
      .mutation(async ({ input }) => {
        await edu.setApplicationStatus(input.id, input.status);
        return { success: true } as const;
      }),
    deleteApplication: adminProcedure
      .input(z.object({ id: z.number().int() }))
      .mutation(async ({ input }) => {
        await edu.deleteApplication(input.id);
        return { success: true } as const;
      }),
    completeApproved: adminProcedure
      .input(z.object({ courseId: z.number().int() }))
      .mutation(async ({ input }) => {
        await edu.completeApprovedApplications(input.courseId);
        return { success: true } as const;
      }),

    questions: adminProcedure.query(async () => {
      const qs = await edu.listQuestions();
      return qs.map(q => ({ ...q, options: edu.parseOptions(q.options) }));
    }),
    createQuestion: adminProcedure.input(questionInput).mutation(async ({ input }) => {
      await edu.createQuestion(input);
      return { success: true } as const;
    }),
    updateQuestion: adminProcedure
      .input(z.object({ id: z.number().int(), data: questionInput }))
      .mutation(async ({ input }) => {
        await edu.updateQuestion(input.id, input.data);
        return { success: true } as const;
      }),
    deleteQuestion: adminProcedure
      .input(z.object({ id: z.number().int() }))
      .mutation(async ({ input }) => {
        await edu.deleteQuestion(input.id);
        return { success: true } as const;
      }),
    moveQuestion: adminProcedure
      .input(z.object({ id: z.number().int(), dir: z.enum(["up", "down"]) }))
      .mutation(async ({ input }) => {
        await edu.moveQuestion(input.id, input.dir);
        return { success: true } as const;
      }),
    seedQuestions: adminProcedure.mutation(async () => ({ seeded: await edu.seedDefaultQuestions() })),

    users: adminProcedure.query(() => edu.listUsers()),
    setUserRole: adminProcedure
      .input(z.object({ id: z.number().int(), role: z.enum(["user", "admin"]) }))
      .mutation(async ({ input, ctx }) => {
        if (input.id === ctx.user.id && input.role !== "admin")
          throw new TRPCError({ code: "BAD_REQUEST", message: "본인의 관리자 권한은 해제할 수 없습니다." });
        await edu.setUserRole(input.id, input.role);
        return { success: true } as const;
      }),
  }),
});

export type AppRouter = typeof appRouter;
