import { compareSync } from "bcrypt-ts";
import { NextResponse } from "next/server";
import { z } from "zod";

import { setSessionCookie } from "@/lib/auth/session";
import { getUserByEmail } from "@/lib/db/queries";

const schema = z.object({
  email: z.string().email().max(128),
  password: z.string().min(1).max(72),
});

export async function POST(request: Request) {
  let body: z.infer<typeof schema>;

  try {
    body = schema.parse(await request.json());
  } catch {
    return NextResponse.json(
      { error: "invalid", message: "Enter a valid email and password." },
      { status: 400 }
    );
  }

  const found = await getUserByEmail(body.email);

  // Same response for "no such user" and "wrong password" so the endpoint
  // can't be used to enumerate registered emails.
  if (!found?.password || !compareSync(body.password, found.password)) {
    return NextResponse.json(
      { error: "credentials", message: "Email or password is incorrect." },
      { status: 401 }
    );
  }

  await setSessionCookie({
    userId: found.id,
    email: found.email,
    isGuest: false,
  });

  return NextResponse.json({ user: { email: found.email, isGuest: false } });
}
