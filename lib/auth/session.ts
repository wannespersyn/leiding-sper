import "server-only";
import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { accounts, persons, sessions } from "@/db/schema";

const COOKIE_NAME = "session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 60; // 60 days

export type SessionUser = {
  sessionId: string;
  accountId: string;
  personId: string;
  name: string;
  isAdmin: boolean;
};

export async function createSession(accountId: string) {
  const id = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  await db.insert(sessions).values({ id, accountId, expiresAt });

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const rows = await db
    .select({
      sessionId: sessions.id,
      expiresAt: sessions.expiresAt,
      accountId: accounts.id,
      personId: persons.id,
      name: persons.name,
      isAdmin: persons.isAdmin,
    })
    .from(sessions)
    .innerJoin(accounts, eq(sessions.accountId, accounts.id))
    .innerJoin(persons, eq(accounts.personId, persons.id))
    .where(eq(sessions.id, token))
    .limit(1);

  const row = rows[0];
  if (!row) return null;

  if (row.expiresAt.getTime() < Date.now()) {
    await db.delete(sessions).where(eq(sessions.id, token));
    return null;
  }

  return {
    sessionId: row.sessionId,
    accountId: row.accountId,
    personId: row.personId,
    name: row.name,
    isAdmin: row.isAdmin,
  };
}

export async function destroySession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (token) {
    await db.delete(sessions).where(eq(sessions.id, token));
  }
  cookieStore.delete(COOKIE_NAME);
}

/** For use inside Server Actions: throws rather than redirecting, since a
 * mutation has no sensible "page" to render a redirect into. */
export async function requireSession(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) {
    throw new Error("Not authenticated");
  }
  return session;
}

export async function requireAdmin(): Promise<SessionUser> {
  const session = await requireSession();
  if (!session.isAdmin) {
    throw new Error("Not authorized");
  }
  return session;
}

/** For use inside Server Component pages: redirects to /login instead of
 * throwing when there's no valid session (e.g. cookie present but the
 * session row was deleted/expired). */
export async function requireSessionForPage(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }
  return session;
}

export async function requireAdminForPage(): Promise<SessionUser> {
  const session = await requireSessionForPage();
  if (!session.isAdmin) {
    redirect("/");
  }
  return session;
}
