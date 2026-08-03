import { randomUUID } from "node:crypto";

import { AppShell } from "@/components/app-shell";
import { getAvailableModels } from "@/lib/ai/models";
import { getSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = await getSession();

  return (
    <AppShell
      chatId={randomUUID()}
      initialMessages={[]}
      models={getAvailableModels()}
      account={
        session
          ? { email: session.email, isGuest: session.isGuest }
          : { email: null, isGuest: true }
      }
    />
  );
}
