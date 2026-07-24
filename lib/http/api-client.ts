"use client";

import type {
  ApiErrorDto,
  AdminOverviewDto,
  BeerAddedDto,
  BeerStatisticsDto,
  BeerTypeDto,
  EventDashboardDto,
  EventSummaryDto,
  UserDto,
  UpdateBeerLogInput,
} from "@/lib/types/api";
import type { RegistrationInput } from "@/lib/validation/auth";
import type { CreateEventInput } from "@/lib/validation/event";

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

export function getBeerTypes(): Promise<BeerTypeDto[]> {
  return request<BeerTypeDto[]>("/api/beer-types");
}

export function createBeerType(
  name: string,
  photoDataUrl: string,
): Promise<BeerTypeDto> {
  return request<BeerTypeDto>("/api/beer-types", {
    method: "POST",
    body: JSON.stringify({ name, photoDataUrl }),
  });
}

export function deleteBeerType(beerTypeId: string): Promise<{ success: true }> {
  return request<{ success: true }>(`/api/beer-types/${beerTypeId}`, {
    method: "DELETE",
  });
}

export function getAdminOverview(page = 0, size = 20): Promise<AdminOverviewDto> {
  return request<AdminOverviewDto>(`/api/admin/overview?page=${page}&size=${size}`);
}

export function updateAdminBeerLog(
  logId: string,
  input: UpdateBeerLogInput,
): Promise<{ success: true }> {
  return request<{ success: true }>(`/api/admin/logs/${logId}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function deleteAdminBeerLog(logId: string): Promise<{ success: true }> {
  return request<{ success: true }>(`/api/admin/logs/${logId}`, {
    method: "DELETE",
  });
}

export function getBeerStatistics(timeZone: string): Promise<BeerStatisticsDto> {
  return request<BeerStatisticsDto>(
    `/api/beers/statistics?timeZone=${encodeURIComponent(timeZone)}`,
  );
}

export function getEvents(): Promise<EventSummaryDto[]> {
  return request<EventSummaryDto[]>("/api/events");
}

export function createEvent(input: CreateEventInput): Promise<EventSummaryDto> {
  return request<EventSummaryDto>("/api/events", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function joinEvent(code: string): Promise<EventSummaryDto> {
  return request<EventSummaryDto>("/api/events/join", {
    method: "POST",
    body: JSON.stringify({ code }),
  });
}

export function getEventDashboard(
  eventId: string,
  timeZone: string,
  beerTypeIds: string[] = [],
  page = 0,
  size = 12,
): Promise<EventDashboardDto> {
  const query = new URLSearchParams({
    timeZone,
    page: String(page),
    size: String(size),
  });
  if (beerTypeIds.length > 0) {
    query.set("beerTypeIds", beerTypeIds.join(","));
  }
  return request<EventDashboardDto>(`/api/events/${eventId}?${query}`);
}

export function addEventBeer(
  eventId: string,
  beerTypeId: string,
): Promise<BeerAddedDto> {
  return request<BeerAddedDto>(`/api/events/${eventId}/beers`, {
    method: "POST",
    body: JSON.stringify({ beerTypeId }),
  });
}
