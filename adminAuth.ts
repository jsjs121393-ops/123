import { parse as parseCookieHeader } from "cookie";
import { timingSafeEqual } from "node:crypto";
import type { CookieOptions, Request } from "express";
import { SignJWT, jwtVerify } from "jose";
import type { User } from "../../drizzle/schema";

export const ADMIN_SESSION_COOKIE = "nephtys_admin_session";
export const ADMIN_USERNAME = "admin";
const ADMIN_SESSION_DAYS = 7;

type AdminSession = {
  kind: "nephtys-admin";
  username: string;
};

function getAdminPassword() {
  const value = process.env.NEPHTHYS_ADMIN_PASSWORD;
  if (!value) throw new Error("NEPHTHYS_ADMIN_PASSWORD is not configured");
  return value;
}

function adminSecret() {
  return new TextEncoder().encode(getAdminPassword());
}

export function adminCookieOptions(): CookieOptions {
  // Preview is public HTTPS in a cross-site frame even when the upstream request is HTTP.
  return {
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure: true,
    maxAge: ADMIN_SESSION_DAYS * 24 * 60 * 60 * 1000,
  };
}

export function adminCookieClearOptions(): CookieOptions {
  const { maxAge: _maxAge, ...options } = adminCookieOptions();
  return options;
}

export function verifyAdminPassword(password: string) {
  const expected = Buffer.from(getAdminPassword(), "utf8");
  const actual = Buffer.from(password, "utf8");
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export async function createAdminSession(username = ADMIN_USERNAME) {
  return new SignJWT({ kind: "nephtys-admin", username })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuedAt()
    .setExpirationTime(`${ADMIN_SESSION_DAYS}d`)
    .sign(adminSecret());
}

async function verifyAdminSession(token: string | undefined) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, adminSecret(), { algorithms: ["HS256"] });
    if (payload.kind !== "nephtys-admin" || payload.username !== ADMIN_USERNAME) return null;
    return payload as unknown as AdminSession;
  } catch {
    return null;
  }
}

/**
 * Converts a valid separate password session into the same admin-shaped user
 * consumed by protectedProcedure/adminProcedure. It never touches the OAuth users table.
 */
export async function authenticateAdminRequest(req: Request): Promise<User | null> {
  const cookies = parseCookieHeader(req.headers.cookie ?? "");
  const session = await verifyAdminSession(cookies[ADMIN_SESSION_COOKIE]);
  if (!session) return null;
  const now = new Date();
  return {
    id: -1,
    openId: "nephtys-local-admin",
    name: "네프티스 관리자",
    email: null,
    loginMethod: "password",
    role: "admin",
    createdAt: now,
    updatedAt: now,
    lastSignedIn: now,
  };
}
