import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getEventDashboard: vi.fn(),
  replace: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock("next-auth/react", () => ({ signOut: mocks.signOut }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mocks.replace }),
}));
vi.mock("@/lib/http/api-client", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/http/api-client")>()),
  getEventDashboard: mocks.getEventDashboard,
}));

import { CompetitionDashboard } from "@/components/competition/competition-dashboard";
import { ApiClientError } from "@/lib/http/api-client";
import type {
  BeerTypeDto,
  EventDashboardDto,
  EventSummaryDto,
} from "@/lib/types/api";

const currentUserId = "4ddde027-2e19-49f6-a213-a93360e8b1fb";
const secondUserId = "56c42ff8-da51-4ea4-a8f9-e6b9db85015b";
const eventId = "1f4fab65-487c-43f2-9a26-41834ca950d9";
const ipaId = "bf0dc4e4-1797-4ef8-9149-fe74d2ac1642";
const lagerId = "8085851e-eb67-4568-ad35-5fe479079840";

const beerTypes: BeerTypeDto[] = [
  {
    id: ipaId,
    name: "IPA",
    photoDataUrl: "data:image/png;base64,aXBh",
    createdAt: "2026-07-17T18:30:00.000Z",
  },
  {
    id: lagerId,
    name: "Lager",
    photoDataUrl: "data:image/png;base64,bGFnZXI=",
    createdAt: "2026-07-17T18:31:00.000Z",
  },
];

const event: EventSummaryDto = {
  id: eventId,
  name: "Driebes 18/07",
  startsAt: "2026-07-18T18:00:00.000Z",
  endsAt: "2026-07-19T02:00:00.000Z",
  status: "ACTIVE",
  isCreator: true,
  inviteCode: "ABC123DEFG",
  memberCount: 2,
  totalBeers: 8,
};

const dashboard: EventDashboardDto = {
  event,
  ranking: [
    {
      position: 1,
      userId: currentUserId,
      username: "Carlos",
      beerCount: 5,
    },
    {
      position: 2,
      userId: secondUserId,
      username: "Lucía",
      beerCount: 3,
    },
  ],
  hourlyConsumption: Array.from({ length: 24 }, (_, hour) => ({
    key: String(hour),
    label: `${String(hour).padStart(2, "0")}:00`,
    count: hour === 20 ? 4 : hour === 21 ? 2 : 0,
  })),
  timeline: {
    bucketMinutes: 60,
    points: [
      {
        key: "18",
        label: "18:00",
        startsAt: "2026-07-18T18:00:00.000Z",
        endsAt: "2026-07-18T19:00:00.000Z",
      },
      {
        key: "19",
        label: "19:00",
        startsAt: "2026-07-18T19:00:00.000Z",
        endsAt: "2026-07-18T20:00:00.000Z",
      },
      {
        key: "20",
        label: "20:00",
        startsAt: "2026-07-18T20:00:00.000Z",
        endsAt: "2026-07-18T21:00:00.000Z",
      },
    ],
    series: [
      {
        key: currentUserId,
        label: "Carlos",
        userId: currentUserId,
        values: [0, 2, 5],
        total: 5,
      },
      {
        key: secondUserId,
        label: "Lucía",
        userId: secondUserId,
        values: [0, 1, 3],
        total: 3,
      },
    ],
  },
  beverageTotals: [
    {
      key: ipaId,
      beerTypeId: ipaId,
      name: "IPA",
      photoDataUrl: beerTypes[0]!.photoDataUrl,
      total: 5,
      percentage: 62.5,
    },
    {
      key: lagerId,
      beerTypeId: lagerId,
      name: "Lager",
      photoDataUrl: beerTypes[1]!.photoDataUrl,
      total: 3,
      percentage: 37.5,
    },
  ],
  participantBreakdown: [
    {
      userId: currentUserId,
      username: "Carlos",
      total: 5,
      values: [3, 2],
    },
    {
      userId: secondUserId,
      username: "Lucía",
      total: 3,
      values: [2, 1],
    },
  ],
  recentLogs: {
    content: [],
    page: 0,
    size: 20,
    totalElements: 0,
    totalPages: 0,
  },
  filteredTotal: 8,
  selectedBeerTypeId: null,
  selectedBeerTypeIds: [],
  timeZone: "Europe/Madrid",
  generatedAt: "2026-07-18T21:00:00.000Z",
};

function renderDashboard(initialDashboard: EventDashboardDto | null = dashboard) {
  return render(
    <CompetitionDashboard
      beerTypes={beerTypes}
      currentUserId={currentUserId}
      events={initialDashboard ? [event] : []}
      initialDashboard={initialDashboard}
      username="Carlos"
    />,
  );
}

describe("CompetitionDashboard", () => {
  beforeEach(() => {
    mocks.getEventDashboard.mockReset();
    mocks.replace.mockReset();
    mocks.signOut.mockReset();
  });

  it("muestra las comparativas visuales y las dos líneas del evento", () => {
    renderDashboard();

    expect(
      screen.getByRole("heading", { name: "La carrera de Driebes 18/07" }),
    ).toBeVisible();
    expect(screen.getByRole("heading", { name: "Carrera acumulada" })).toBeVisible();
    expect(
      screen.getByRole("img", {
        name: /Carrera acumulada de consumiciones por participante/,
      }),
    ).toBeVisible();
    expect(
      within(screen.getByLabelText("Leyenda de participantes")).getByText("Carlos"),
    ).toBeVisible();
    expect(
      within(screen.getByLabelText("Leyenda de participantes")).getByText("Lucía"),
    ).toBeVisible();
    expect(screen.getByRole("heading", { name: "Qué se está bebiendo" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "Ritmo por hora" })).toBeVisible();
    expect(
      screen.getByRole("img", { name: /Ritmo de consumiciones por hora/ }),
    ).toBeVisible();
    expect(screen.getByRole("heading", { name: "Quién bebe qué" })).toBeVisible();
    expect(
      screen.getByRole("heading", { name: "Clasificación del evento" }),
    ).toBeVisible();
  });

  it("permite aislar participantes en la carrera acumulada", async () => {
    const browserUser = userEvent.setup();
    renderDashboard();

    await browserUser.click(
      screen.getByRole("button", { name: "Carlos" }),
    );

    const legend = screen.getByLabelText("Leyenda de participantes");
    expect(within(legend).getByText("Carlos")).toBeVisible();
    expect(within(legend).queryByText("Lucía")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Carlos" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "Lucía" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("recalcula todas las comparativas al filtrar por bebida", async () => {
    const browserUser = userEvent.setup();
    const filteredDashboard: EventDashboardDto = {
      ...dashboard,
      filteredTotal: 5,
      selectedBeerTypeId: ipaId,
      selectedBeerTypeIds: [ipaId],
    };
    mocks.getEventDashboard.mockResolvedValue(filteredDashboard);
    renderDashboard();

    await browserUser.click(screen.getByRole("button", { name: "IPA" }));

    const timeZone =
      Intl.DateTimeFormat().resolvedOptions().timeZone || "Europe/Madrid";
    await waitFor(() => {
      expect(mocks.getEventDashboard).toHaveBeenCalledWith(eventId, timeZone, [
        ipaId,
      ]);
    });
    expect(screen.getByRole("button", { name: "IPA" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByText("5", { selector: "p" })).toBeVisible();
  });

  it("restaura los filtros si no puede recalcular la comparativa", async () => {
    const browserUser = userEvent.setup();
    mocks.getEventDashboard.mockRejectedValue(
      new ApiClientError(500, {
        timestamp: "2026-07-18T21:00:00.000Z",
        status: 500,
        error: "Internal server error",
        message: "No se ha podido cargar el análisis",
        path: `/api/events/${eventId}`,
      }),
    );
    renderDashboard();

    await browserUser.click(screen.getByRole("button", { name: "IPA" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "No se ha podido cargar el análisis",
    );
    expect(screen.getByRole("button", { name: "IPA" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    expect(screen.getByRole("button", { name: "Todas" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("orienta al usuario cuando todavía no tiene un evento seleccionado", () => {
    renderDashboard(null);

    expect(
      screen.getByRole("heading", { name: "Elige un evento para analizarlo" }),
    ).toBeVisible();
    expect(screen.getByRole("combobox", { name: "Evento" })).toBeDisabled();
    const eventLinks = screen.getAllByRole("link", {
      name: "Gestionar eventos",
    });
    expect(eventLinks).toHaveLength(2);
    eventLinks.forEach((link) => expect(link).toHaveAttribute("href", "/events"));
    expect(mocks.getEventDashboard).not.toHaveBeenCalled();
  });
});
