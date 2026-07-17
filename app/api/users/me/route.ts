import { getCurrentUserId } from "@/lib/auth/session";
import { withErrorHandling } from "@/lib/http/errors";
import { getUserById } from "@/lib/services/user-service";

export const GET = withErrorHandling(async () => {
  const userId = await getCurrentUserId();
  const user = await getUserById(userId);

  return Response.json(user);
});
