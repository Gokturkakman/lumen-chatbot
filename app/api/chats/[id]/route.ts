import { NextResponse } from "next/server";
import { z } from "zod";

import { getSession } from "@/lib/auth/session";
import { deleteChat, getChatById, renameChat } from "@/lib/db/queries";

type Params = { params: Promise<{ id: string }> };

type AuthResult =
  | { ok: false; response: NextResponse }
  | { ok: true; userId: string };

async function authorize(id: string): Promise<AuthResult> {
  const session = await getSession();
  if (!session) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const chat = await getChatById(id);
  if (!chat) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Not found" }, { status: 404 }),
    };
  }
  if (chat.userId !== session.userId) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return { ok: true, userId: session.userId };
}

export async function DELETE(_request: Request, { params }: Params) {
  const { id } = await params;
  const auth = await authorize(id);
  if (!auth.ok) return auth.response;

  await deleteChat({ id, userId: auth.userId });
  return NextResponse.json({ ok: true });
}

const patchSchema = z.object({ title: z.string().min(1).max(120) });

export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params;
  const auth = await authorize(id);
  if (!auth.ok) return auth.response;

  let title: string;
  try {
    ({ title } = patchSchema.parse(await request.json()));
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  await renameChat({ id, userId: auth.userId, title: title.trim() });
  return NextResponse.json({ ok: true });
}
