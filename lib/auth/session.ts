import "server-only";

import { jwtVerify, SignJWT } from "jose";
import { cookies } from "next/headers";

import { createGuestUser, getUserById } from "@/lib/db/queries";

const COOKIE_NAME = "lumen_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 90; // 90 days

export type Session = {
  userId: string;
  email: string | null;
  isGuest: boolean;
};

function secret() {
  const value = process.env.AUTH_SECRET;
  if (!value) {
    throw new Error(
      "AUTH_SECRET is not set. Generate one with: openssl rand -base64 32"
    );
  }
  return new TextEncoder().encode(value);
}

export async function signSession(session: Session): Promise<string> {
  return await new SignJWT({ ...session })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_SECONDS}s`)
    .sign(secret());
}

async function readSessionCookie(): Promise<Session | null> {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, secret());
    if (typeof payload.userId !== "string") return null;
    return {
      userId: payload.userId,
      email: typeof payload.email === "string" ? payload.email : null,
      isGuest: payload.isGuest !== false,
    };
  } catch {
    return null;
  }
}

export async function setSessionCookie(session: Session) {
  const token = await signSession(session);
  (await cookies()).set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function clearSessionCookie() {
  (await cookies()).delete(COOKIE_NAME);
}

/** Returns the current session without creating one. */
export async function getSession(): Promise<Session | null> {
  const session = await readSessionCookie();
  if (!session) return null;

  // The cookie can outlive the row (e.g. after a database reset), so confirm
  // the user still exists before trusting it.
  const found = await getUserById(session.userId);
  if (!found) return null;

  return { userId: found.id, email: found.email, isGuest: found.isGuest };
}

/**
 * Returns the current session, silently creating a guest account on first
 * visit. Called from Server Components and route handlers so a visitor can
 * start chatting immediately without a sign-up wall.
 */
export async function getOrCreateSession(): Promise<Session> {
  const existing = await getSession();
  if (existing) return existing;

  const guest = await createGuestUser();
  const session: Session = {
    userId: guest.id,
    email: null,
    isGuest: true,
  };
  await setSessionCookie(session);
  return session;
}
