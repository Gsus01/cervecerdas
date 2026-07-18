import { requireAdmin } from "@/lib/auth/session";
import { withErrorHandling } from "@/lib/http/errors";
import { getAdminOverview } from "@/lib/services/admin-service";
import { paginationSchema } from "@/lib/validation/pagination";

export const GET = withErrorHandling(async (request) => {
  await requireAdmin();
  const url = new URL(request.url);
  const pagination = paginationSchema.parse({
    page: url.searchParams.get("page") ?? undefined,
    size: url.searchParams.get("size") ?? undefined,
  });

  return Response.json(
    await getAdminOverview(pagination.page, pagination.size),
  );
});
