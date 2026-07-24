import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  addEventBeer: vi.fn(),
  getEventDashboard: vi.fn(),
  routerReplace: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mocks.routerReplace }),
}));
vi.mock("next-auth/react", () => ({ signOut: mocks.signOut }));
vi.mock("@/lib/http/api-client", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/http/api-client")>()),
  addEventBeer: mocks.addEventBeer,
  getEventDashboard: mocks.getEventDashboard,
}));

import { Dashboard } from "@/components/dashboard/dashboard";
import { ApiClientError } from "@/lib/http/api-client";
import type {
  BeerLogDto,
  BeerTypeDto,
  EventDashboardDto,
  EventSummaryDto,
  UserDto,
} from "@/lib/types/api";

const user: UserDto = {
  id: "4ddde027-2e19-49f6-a213-a93360e8b1fb",
  username: "Carlos",
  email: "carlos@example.com",
  role: "USER",
  beerCount: 12,
  createdAt: "2026-07-17T18:00:00.000Z",
  updatedAt: "2026-07-17T18:00:00.000Z",
};
const event: EventSummaryDto = {
  id: "1f4fab65-487c-43f2-9a26-41834ca950d9",
  name: "Driebes 18/07",
  startsAt: "2020-01-01T00:00:00.000Z",
  endsAt: "2099-01-01T00:00:00.000Z",
  status: "ACTIVE",
  isCreator: true,
  inviteCode: "ABC123DEFG",
  memberCount: 2,
  totalBeers: 5,
};
const beerType: BeerTypeDto = {
  id: "bf0dc4e4-1797-4ef8-9149-fe74d2ac1642",
  name: "IPA",
  photoDataUrl: "data:image/png;base64,aW1hZ2Vu",
  createdAt: "2026-07-17T18:30:00.000Z",
};
const initialDashboard: EventDashboardDto = {
  event,
  ranking: [
    { position: 1, userId: user.id, username: "Carlos", beerCount: 3 },
    {
      position: 2,
      userId: "56c42ff8-da51-4ea4-a8f9-e6b9db85015b",
      username: "Lucía",
      beerCount: 2,
    },
  ],
  hourlyConsumption: [],
  timeline: {
    bucketMinutes: 60,
    points: [],
    series: [],
  },
  beverageTotals: [],
  participantBreakdown: [],
  recentLogs: {
    content: [],
    page: 0,
    size: 12,
    totalElements: 0,
    totalPages: 0,
  },
  filteredTotal: 5,
  selectedBeerTypeId: null,
  selectedBeerTypeIds: [],
  timeZone: "Europe/Madrid",
  generatedAt: "2026-07-18T20:00:00.000Z",
};

function renderDashboard(dashboard: EventDashboardDto = initialDashboard) {
  return render(
    <Dashboard
      initialBeerTypes={[beerType]}
      initialDashboard={dashboard}
      initialEvents={[dashboard.event]}
      initialUser={user}
    />,
  );
}

describe("Dashboard", () => {
  beforeEach(() => {
    mocks.addEventBeer.mockReset();
    mocks.getEventDashboard.mockReset();
    mocks.routerReplace.mockReset();
    mocks.signOut.mockReset();
  });

  it("renderiza el contador ligado al evento seleccionado", () => {
    renderDashboard();

    expect(
      screen.getByRole("combobox", { name: "Evento" }),
    ).toHaveValue(event.id);
    expect(
      screen.getByRole("heading", { level: 1, name: event.name }),
    ).toBeVisible();
    expect(
      screen.getByLabelText(
        `3 consumiciones registradas en ${event.name}`,
      ),
    ).toBeVisible();
    expect(
      screen.getByRole("heading", { name: "Ranking del evento" }),
    ).toBeVisible();
    expect(
      screen.getByRole("heading", { name: "Actividad del evento" }),
    ).toBeVisible();
  });

  it("registra una bebida en el evento y refresca su dashboard", async () => {
    const browserUser = userEvent.setup();
    const newLog: BeerLogDto = {
      id: "df32cc9b-bb38-4f40-aee4-953f92795f8c",
      userId: user.id,
      username: user.username,
      actionType: "BEER_ADDED",
      quantity: 1,
      beerType,
      createdAt: "2026-07-18T20:05:00.000Z",
    };
    const refreshedDashboard: EventDashboardDto = {
      ...initialDashboard,
      event: { ...event, totalBeers: 6 },
      ranking: [
        { position: 1, userId: user.id, username: "Carlos", beerCount: 4 },
        initialDashboard.ranking[1]!,
      ],
      recentLogs: {
        ...initialDashboard.recentLogs,
        content: [newLog],
        totalElements: 1,
        totalPages: 1,
      },
      filteredTotal: 6,
    };
    mocks.addEventBeer.mockResolvedValue({ beerCount: 4, log: newLog });
    mocks.getEventDashboard.mockResolvedValue(refreshedDashboard);
    renderDashboard();

    await browserUser.selectOptions(
      screen.getByRole("combobox", { name: "Tipo de bebida" }),
      beerType.id,
    );
    await browserUser.click(
      screen.getByRole("button", { name: "Registrar bebida" }),
    );

    expect(
      await screen.findByLabelText(
        `4 consumiciones registradas en ${event.name}`,
      ),
    ).toBeVisible();
    expect(
      screen.getByText("Bebida registrada en este evento. ¡Salud!"),
    ).toBeVisible();
    expect(mocks.addEventBeer).toHaveBeenCalledOnce();
    expect(mocks.addEventBeer).toHaveBeenCalledWith(event.id, beerType.id);
    expect(mocks.getEventDashboard).toHaveBeenCalledOnce();
    expect(mocks.getEventDashboard).toHaveBeenCalledWith(
      event.id,
      expect.any(String),
      [],
      0,
    );
  });

  it("mantiene el contador y anuncia el error de registro", async () => {
    const browserUser = userEvent.setup();
    mocks.addEventBeer.mockRejectedValue(
      new ApiClientError(409, {
        timestamp: "2026-07-18T20:05:00.000Z",
        status: 409,
        error: "Conflict",
        message: "El evento ya ha finalizado",
        path: `/api/events/${event.id}/beers`,
      }),
    );
    renderDashboard();

    await browserUser.selectOptions(
      screen.getByRole("combobox", { name: "Tipo de bebida" }),
      beerType.id,
    );
    await browserUser.click(
      screen.getByRole("button", { name: "Registrar bebida" }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "El evento ya ha finalizado",
    );
    expect(
      screen.getByLabelText(
        `3 consumiciones registradas en ${event.name}`,
      ),
    ).toBeVisible();
    expect(mocks.getEventDashboard).not.toHaveBeenCalled();
  });

  it.each([
    {
      event: {
        ...event,
        startsAt: "2099-01-01T12:00:00.000Z",
        endsAt: "2099-01-01T20:00:00.000Z",
        status: "UPCOMING" as const,
      },
      message: "Podrás registrar cuando empiece el evento.",
    },
    {
      event: {
        ...event,
        startsAt: "2020-01-01T12:00:00.000Z",
        endsAt: "2020-01-01T20:00:00.000Z",
        status: "FINISHED" as const,
      },
      message: "Este evento ha finalizado y ya no admite registros.",
    },
  ])(
    "bloquea el registro cuando el evento está $event.status",
    ({ event: unavailableEvent, message }) => {
      renderDashboard({
        ...initialDashboard,
        event: unavailableEvent,
      });

      expect(
        screen.getByRole("combobox", { name: "Tipo de bebida" }),
      ).toBeDisabled();
      expect(
        screen.getByRole("button", { name: "Registrar bebida" }),
      ).toBeDisabled();
      expect(screen.getByText(message)).toBeVisible();
      expect(mocks.addEventBeer).not.toHaveBeenCalled();
    },
  );
});
