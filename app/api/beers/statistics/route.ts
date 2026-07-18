import { getCurrentUserId } from "@/lib/auth/session";
import { withErrorHandling } from "@/lib/http/errors";
import { getBeerStatistics } from "@/lib/services/statistics-service";
import { statisticsTimeZoneSchema } from "@/lib/validation/statistics";

export const GET = withErrorHandling(async (request) => {
  const userId = await getCurrentUserId();
  const url = new URL(request.url);
  const timeZone = statisticsTimeZoneSchema.parse(
    url.searchParams.get("timeZone") ?? undefined,
  );

  return Response.json(await getBeerStatistics(userId, timeZone));
});
