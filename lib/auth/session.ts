import "server-only";

import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth/options";
import { ForbiddenError, UnauthorizedError } from "@/lib/http/errors";
import { getUserById } from "@/lib/services/user-service";

export async function getCurrentUserId(): Promise<string> {
  const session = await getServerSession(authOptions);

  if (!session?.user.id) {
    throw new UnauthorizedError();
  }

  return session.user.id;
}

export async function requireAdmin(): Promise<string> {
  const userId = await getCurrentUserId();
  const user = await getUserById(userId);

  if (user.role !== "ADMIN") {
    throw new ForbiddenError();
  }

  return userId;
}
