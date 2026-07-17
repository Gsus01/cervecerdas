import "server-only";

import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth/options";
import { UnauthorizedError } from "@/lib/http/errors";

export async function getCurrentUserId(): Promise<string> {
  const session = await getServerSession(authOptions);

  if (!session?.user.id) {
    throw new UnauthorizedError();
  }

  return session.user.id;
}
