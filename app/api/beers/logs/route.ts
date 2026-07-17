import { getCurrentUserId } from "@/lib/auth/session";
import { withErrorHandling } from "@/lib/http/errors";
import { getBeerLogs } from "@/lib/services/beer-service";
import { paginationSchema } from "@/lib/validation/pagination";

export const GET = withErrorHandling(async (request) => {
  await getCurrentUserId();
  const url = new URL(request.url);
  const pagination = paginationSchema.parse({
    page: url.searchParams.get("page") ?? undefined,
    size: url.searchParams.get("size") ?? undefined,
  });
  const logs = await getBeerLogs(pagination.page, pagination.size);

  return Response.json(logs);
});
