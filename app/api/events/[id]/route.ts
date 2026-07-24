import { getCurrentUserId } from "@/lib/auth/session";
import { withErrorHandling } from "@/lib/http/errors";
import { getEventDashboard } from "@/lib/services/event-service";
import {
  eventDashboardQuerySchema,
  eventIdSchema,
} from "@/lib/validation/event";

function idFromRequest(request: Request): string {
  return eventIdSchema.parse(new URL(request.url).pathname.split("/").at(-1));
}

export const GET = withErrorHandling(async (request) => {
  const userId = await getCurrentUserId();
  const url = new URL(request.url);
  const beerTypeIds = [
    ...url.searchParams.getAll("beerTypeId"),
    ...url.searchParams
      .getAll("beerTypeIds")
      .flatMap((value) => value.split(",")),
  ]
    .map((value) => value.trim())
    .filter(Boolean);
  const query = eventDashboardQuerySchema.parse({
    beerTypeIds,
    page: url.searchParams.get("page") || undefined,
    size: url.searchParams.get("size") || undefined,
    timeZone: url.searchParams.get("timeZone") || undefined,
  });
  const dashboard = await getEventDashboard(
    idFromRequest(request),
    userId,
    query.timeZone,
    query.beerTypeIds,
    query.page,
    query.size,
  );

  return Response.json(dashboard);
});
