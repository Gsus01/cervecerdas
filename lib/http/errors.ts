import { ZodError } from "zod";

import type { ApiErrorDto } from "@/lib/types/api";

export class HttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly errorName: string,
    message: string,
    public readonly fieldErrors?: Record<string, string[]>,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export class UnauthorizedError extends HttpError {
  constructor(message = "Debes iniciar sesión para continuar") {
    super(401, "Unauthorized", message);
  }
}

export class ForbiddenError extends HttpError {
  constructor(message = "No tienes permisos para realizar esta operación") {
    super(403, "Forbidden", message);
  }
}

export class NotFoundError extends HttpError {
  constructor(message: string) {
    super(404, "Not found", message);
  }
}

export class ConflictError extends HttpError {
  constructor(message: string) {
    super(409, "Conflict", message);
  }
}

export class BadRequestError extends HttpError {
  constructor(message: string) {
    super(400, "Bad request", message);
  }
}

export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new BadRequestError("El cuerpo de la petición debe ser JSON válido");
  }
}

function errorResponse(error: unknown, request: Request): Response {
  const path = new URL(request.url).pathname;
  let status = 500;
  let errorName = "Internal server error";
  let message = "Ha ocurrido un error inesperado";
  let fieldErrors: Record<string, string[]> | undefined;

  if (error instanceof ZodError) {
    status = 400;
    errorName = "Validation error";
    message = "Revisa los datos enviados";
    fieldErrors = Object.fromEntries(
      Object.entries(error.flatten().fieldErrors).filter(
        (entry): entry is [string, string[]] => Array.isArray(entry[1]),
      ),
    );
  } else if (error instanceof HttpError) {
    status = error.status;
    errorName = error.errorName;
    message = error.message;
    fieldErrors = error.fieldErrors;
  } else {
    console.error("Error no controlado en la API", error);
  }

  const body: ApiErrorDto = {
    timestamp: new Date().toISOString(),
    status,
    error: errorName,
    message,
    path,
    ...(fieldErrors ? { fieldErrors } : {}),
  };

  return Response.json(body, { status });
}

export function withErrorHandling(
  handler: (request: Request) => Promise<Response>,
): (request: Request) => Promise<Response> {
  return async (request) => {
    try {
      return await handler(request);
    } catch (error) {
      return errorResponse(error, request);
    }
  };
}
