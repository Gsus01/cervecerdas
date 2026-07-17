import { getCurrentUserId } from "@/lib/auth/session";
import { withErrorHandling } from "@/lib/http/errors";
import { getRanking } from "@/lib/services/user-service";

export const GET = withErrorHandling(async () => {
  await getCurrentUserId();
  const ranking = await getRanking();

  return Response.json(ranking);
});
