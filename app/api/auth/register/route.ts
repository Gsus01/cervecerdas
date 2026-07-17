import { withErrorHandling, readJson } from "@/lib/http/errors";
import { registerUser } from "@/lib/services/user-service";

export const POST = withErrorHandling(async (request) => {
  const input = await readJson(request);
  const user = await registerUser(input);

  return Response.json(user, { status: 201 });
});
