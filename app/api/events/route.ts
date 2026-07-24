import { getCurrentUserId } from "@/lib/auth/session";
import { readJson, withErrorHandling } from "@/lib/http/errors";
import { createEvent, getEventsForUser } from "@/lib/services/event-service";
import { createEventSchema } from "@/lib/validation/event";

export const GET = withErrorHandling(async () => {
  const userId = await getCurrentUserId();
  return Response.json(await getEventsForUser(userId));
});

export const POST = withErrorHandling(async (request) => {
  const userId = await getCurrentUserId();
  const input = createEventSchema.parse(await readJson(request));
  return Response.json(await createEvent(userId, input), { status: 201 });
});
