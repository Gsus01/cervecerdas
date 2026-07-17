"use client";

import type {
  ApiErrorDto,
  BeerAddedDto,
  BeerLogDto,
  PageDto,
  RankingEntryDto,
  UserDto,
} from "@/lib/types/api";
import type { RegistrationInput } from "@/lib/validation/auth";

export class ApiClientError extends Error {
  constructor(
    public readonly status: number,
    public readonly details: ApiErrorDto,
  ) {
    super(details.message);
    this.name = "ApiClientError";
  }
}

function fallbackError(status: number, path: string): ApiErrorDto {
  return {
    timestamp: new Date().toISOString(),
    status,
    error: status === 0 ? "Connection error" : "Request error",
    message:
      status === 0
        ? "No se ha podido conectar con el servidor"
        : "La petición no se ha podido completar",
    path,
  };
}

function isApiError(value: unknown): value is ApiErrorDto {
  return (
    typeof value === "object" &&
    value !== null &&
    "status" in value &&
    typeof value.status === "number" &&
    "message" in value &&
    typeof value.message === "string"
  );
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  let response: Response;
  try {
    response = await fetch(path, {
      ...init,
      headers,
      credentials: "same-origin",
      cache: "no-store",
    });
  } catch {
    throw new ApiClientError(0, fallbackError(0, path));
  }

  if (!response.ok) {
    let details = fallbackError(response.status, path);
    try {
      const body: unknown = await response.json();
      if (isApiError(body)) {
        details = body;
      }
    } catch {
      // Conserva el error genérico cuando la respuesta no contiene JSON.
    }

    if (
      response.status === 401 &&
      typeof window !== "undefined" &&
      window.location.pathname !== "/login"
    ) {
      window.location.assign("/login?reason=expired");
    }

    throw new ApiClientError(response.status, details);
  }

  return (await response.json()) as T;
}

export function registerAccount(input: RegistrationInput): Promise<UserDto> {
  return request<UserDto>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function getCurrentUser(): Promise<UserDto> {
  return request<UserDto>("/api/users/me");
}

export function getRanking(): Promise<RankingEntryDto[]> {
  return request<RankingEntryDto[]>("/api/users/ranking");
}

export function addBeer(): Promise<BeerAddedDto> {
  return request<BeerAddedDto>("/api/beers", { method: "POST" });
}

export function getBeerLogs(page = 0, size = 20): Promise<PageDto<BeerLogDto>> {
  return request<PageDto<BeerLogDto>>(`/api/beers/logs?page=${page}&size=${size}`);
}
