import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "../../../server/routers"; // 실제 라우터 경로에 맞게 조정

export const trpc = createTRPCReact<AppRouter>();
