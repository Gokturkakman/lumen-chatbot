import { hashSync } from "bcrypt-ts";
import { NextResponse } from "next/server";
import { z } from "zod";

import { getOrCreateSession, setSessionCookie } from "@/lib/auth/session";
import { getUserByEmail, upgradeGuestToAccount } from "@/lib/db/queries";

const schema = z.object({
  email: z.string().email().max(128),
  password: z.string().min(8).max(72),
});

export async function POST(request: Request) {
  let body: z.infer<typeof schema>;

  try {
    body = schema.parse(await request.json());
  } catch {
    return NextResponse.json(
      { error: "invalid", message: "Enter a valid email and an 8+ character password." },
      { status: 400 }
    );
  }

  const email = body.email.toLowerCase();

  if (await getUserByEmail(email)) {
    return NextResponse.json(
      { error: "taken", message: "An account with that email already exists." },
      { status: 409 }
    );
  }

  // Upgrading the current guest row in place keeps the chats they already
  // created attached to the new account.
  const session = await getOrCreateSession();

  if (!session.isGuest) {
    return NextResponse.json(
      { error: "signed-in", message: "You are already signed in." },
      { status: 409 }
    );
  }

  let updated: { id: string; email: string | null; isGuest: boolean };

  try {
    updated = await upgradeGuestToAccount({
      userId: session.userId,
      email,
      passwordHash: hashSync(body.password, 10),
    });
  } catch (error) {
    // Two simultaneous sign-ups for the same address: the unique index on
    // User.email rejects the loser (Postgres 23505).
    const code = (error as { code?: string }).code;
    if (code === "23505") {
      return NextResponse.json(
        { error: "taken", message: "An account with that email already exists." },
        { status: 409 }
      );
    }
    throw error;
  }

  await setSessionCookie({
    userId: updated.id,
    email: updated.email,
    isGuest: false,
  });

  return NextResponse.json({ user: { email: updated.email, isGuest: false } });
}
