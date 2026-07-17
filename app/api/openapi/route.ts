import { openApiDocument } from "@/lib/openapi";

export function GET(): Response {
  return Response.json(openApiDocument);
}
