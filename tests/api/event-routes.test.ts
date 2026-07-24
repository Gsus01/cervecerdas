// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth/session", () => ({ getCurrentUserId: vi.fn() }));
vi.mock("@/lib/services/event-service", () => ({
  createEvent: vi.fn(),
  getEventDashboard: vi.fn(),
  getEventsForUser: vi.fn(),
  joinEvent: vi.fn(),
}));
vi.mock("@/lib/services/beer-service", () => ({ addBeerForUser: vi.fn() }));

import { GET as eventDetailRoute } from "@/app/api/events/[id]/route";
import { POST as addEventBeerRoute } from "@/app/api/events/[id]/beers/route";
import {
  GET as eventsRoute,
  POST as createEventRoute,
} from "@/app/api/events/route";
import { POST as joinEventRoute } from "@/app/api/events/join/route";
import { getCurrentUserId } from "@/lib/auth/session";
import { addBeerForUser } from "@/lib/services/beer-service";
import {
  createEvent,
  getEventDashboard,
  getEventsForUser,
  joinEvent,
} from "@/lib/services/event-service";
import type { EventDashboardDto, EventSummaryDto } from "@/lib/types/api";

const userId = "4ddde027-2e19-49f6-a213-a93360e8b1fb";
const eventId = "1f4fab65-487c-43f2-9a26-41834ca950d9";
const beerTypeId = "bf0dc4e4-1797-4ef8-9149-fe74d2ac1642";
const secondBeerTypeId = "8085851e-eb67-4568-ad35-5fe479079840";
const event: EventSummaryDto = {
  id: eventId,
  name: "Asado pani",
  startsAt: "2026-08-20T12:00:00.000Z",
  endsAt: "2026-08-20T22:00:00.000Z",
  status: "UPCOMING",
  isCreator: true,
  inviteCode: "ABC123DEFG",
  memberCount: 1,
  totalBeers: 0,
};

describe("rutas de eventos", () => {
  beforeEach(() => {
    vi.mocked(getCurrentUserId).mockReset().mockResolvedValue(userId);
    vi.mocked(createEvent).mockReset();
    vi.mocked(getEventsForUser).mockReset();
    vi.mocked(joinEvent).mockReset();
    vi.mocked(getEventDashboard).mockReset();
    vi.mocked(addBeerForUser).mockReset();
  });

  it("lista solo los eventos de la identidad de la sesión", async () => {
    vi.mocked(getEventsForUser).mockResolvedValue([event]);

    const response = await eventsRoute(new Request("http://localhost/api/events"));

    expect(response.status).toBe(200);
    expect(getEventsForUser).toHaveBeenCalledWith(userId);
    expect(await response.json()).toEqual([event]);
  });

  it("valida y crea un evento con el usuario autenticado como creador", async () => {
    vi.mocked(createEvent).mockResolvedValue(event);
    const input = {
      name: "Asado pani",
      startsAt: "2026-08-20T12:00:00.000Z",
      endsAt: "2026-08-20T22:00:00.000Z",
    };

    const response = await createEventRoute(
      new Request("http://localhost/api/events", {
        method: "POST",
        body: JSON.stringify({ ...input, creatorId: "otro" }),
      }),
    );

    expect(response.status).toBe(201);
    expect(createEvent).toHaveBeenCalledWith(userId, input);
  });

  it("permite unirse con un código normalizado", async () => {
    vi.mocked(joinEvent).mockResolvedValue(event);

    const response = await joinEventRoute(
      new Request("http://localhost/api/events/join", {
        method: "POST",
        body: JSON.stringify({ code: " abc123defg " }),
      }),
    );

    expect(response.status).toBe(200);
    expect(joinEvent).toHaveBeenCalledWith(userId, "ABC123DEFG");
  });

  it("aplica zona horaria, paginación y filtros combinables al evento privado", async () => {
    const dashboard: EventDashboardDto = {
      event,
      ranking: [],
      hourlyConsumption: [],
      timeline: { bucketMinutes: 15, points: [], series: [] },
      beverageTotals: [],
      participantBreakdown: [],
      recentLogs: {
        content: [],
        page: 2,
        size: 5,
        totalElements: 0,
        totalPages: 0,
      },
      filteredTotal: 0,
      selectedBeerTypeId: beerTypeId,
      selectedBeerTypeIds: [beerTypeId, secondBeerTypeId],
      timeZone: "Europe/Madrid",
      generatedAt: "2026-07-24T10:00:00.000Z",
    };
    vi.mocked(getEventDashboard).mockResolvedValue(dashboard);

    const response = await eventDetailRoute(
      new Request(
        `http://localhost/api/events/${eventId}?timeZone=Europe%2FMadrid&beerTypeId=${beerTypeId}&beerTypeIds=${secondBeerTypeId},${beerTypeId}&page=2&size=5`,
      ),
    );

    expect(response.status).toBe(200);
    expect(getEventDashboard).toHaveBeenCalledWith(
      eventId,
      userId,
      "Europe/Madrid",
      [beerTypeId, secondBeerTypeId],
      2,
      5,
    );
  });

  it("rechaza filtros de bebidas o paginación no válidos", async () => {
    const response = await eventDetailRoute(
      new Request(
        `http://localhost/api/events/${eventId}?beerTypeIds=no-es-uuid&size=51`,
      ),
    );

    expect(response.status).toBe(400);
    expect(getEventDashboard).not.toHaveBeenCalled();
  });

  it("registra la consumición contra el evento y no acepta identidad del cliente", async () => {
    vi.mocked(addBeerForUser).mockResolvedValue({} as never);

    const response = await addEventBeerRoute(
      new Request(`http://localhost/api/events/${eventId}/beers`, {
        method: "POST",
        body: JSON.stringify({ beerTypeId, userId: "otro" }),
      }),
    );

    expect(response.status).toBe(201);
    expect(addBeerForUser).toHaveBeenCalledWith(userId, beerTypeId, eventId);
  });
});
