import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ getBeerStatistics: vi.fn() }));

vi.mock("@/lib/http/api-client", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/http/api-client")>()),
  getBeerStatistics: mocks.getBeerStatistics,
}));

import { StatisticsDashboard } from "@/components/statistics/statistics-dashboard";
import { ApiClientError } from "@/lib/http/api-client";
import type { BeerStatisticsDto } from "@/lib/types/api";

const statistics: BeerStatisticsDto = {
  totalBeers: 12,
  activeDays: 7,
  averagePerActiveDay: 1.7,
  varietyCount: 2,
  last7Days: 5,
  previous7Days: 4,
  recentTrendPercentage: 25,
  favoriteType: {
    key: "ipa",
    beerTypeId: "bf0dc4e4-1797-4ef8-9149-fe74d2ac1642",
    label: "IPA",
    photoDataUrl: "data:image/png;base64,aXBh",
    count: 7,
    percentage: 58,
  },
  favoriteHour: { key: "20", label: "20:00", count: 4 },
  byType: [
    {
      key: "ipa",
      beerTypeId: "bf0dc4e4-1797-4ef8-9149-fe74d2ac1642",
      label: "IPA",
      photoDataUrl: "data:image/png;base64,aXBh",
      count: 7,
      percentage: 58,
    },
    {
      key: "lager",
      beerTypeId: "e3f1b0d4-e521-4481-bd67-ae2b76411d86",
      label: "Lager",
      photoDataUrl: null,
      count: 5,
      percentage: 42,
    },
  ],
  byWeekday: [
    "Lunes",
    "Martes",
    "Miércoles",
    "Jueves",
    "Viernes",
    "Sábados",
    "Domingos",
  ].map(
    (label, index) => ({ key: String(index), label, count: index }),
  ),
  byTimeRange: [
    { key: "early", label: "Madrugada", count: 1 },
    { key: "morning", label: "Mañana", count: 2 },
    { key: "afternoon", label: "Tarde", count: 3 },
    { key: "night", label: "Noche", count: 6 },
  ],
  last14Days: Array.from({ length: 14 }, (_, index) => ({
    key: `2026-07-${String(index + 5).padStart(2, "0")}`,
    label: `día ${index + 5}`,
    count: index % 3,
  })),
  timeZone: "Europe/Madrid",
  generatedAt: "2026-07-18T12:00:00.000Z",
};

describe("StatisticsDashboard", () => {
  beforeEach(() => {
    mocks.getBeerStatistics.mockReset();
  });

  it("muestra métricas y gráficos personales", async () => {
    mocks.getBeerStatistics.mockResolvedValue(statistics);
    render(<StatisticsDashboard username="Carlos" />);

    expect(screen.getByLabelText("Cargando estadísticas")).toBeVisible();
    expect(await screen.findByRole("heading", { name: "Así brinda Carlos" })).toBeVisible();
    expect(screen.getByText("Total registrado")).toBeVisible();
    expect(screen.getByText("Tipo favorito")).toBeVisible();
    expect(screen.getByRole("heading", { name: "Tu ritmo reciente" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "Tipos que eliges" })).toBeVisible();
    expect(mocks.getBeerStatistics).toHaveBeenCalledTimes(1);
  });

  it("muestra un estado vacío con acceso al contador", async () => {
    mocks.getBeerStatistics.mockResolvedValue({
      ...statistics,
      totalBeers: 0,
      favoriteType: null,
      favoriteHour: null,
      byType: [],
    });
    render(<StatisticsDashboard username="Carlos" />);

    expect(await screen.findByText("Tu historia empieza con una")).toBeVisible();
    expect(screen.getByRole("link", { name: "Ir al contador" })).toHaveAttribute(
      "href",
      "/home",
    );
  });

  it("permite reintentar cuando falla la API", async () => {
    const browserUser = userEvent.setup();
    mocks.getBeerStatistics
      .mockRejectedValueOnce(
        new ApiClientError(500, {
          timestamp: "2026-07-18T12:00:00.000Z",
          status: 500,
          error: "Internal server error",
          message: "No se han podido calcular las estadísticas",
          path: "/api/beers/statistics",
        }),
      )
      .mockResolvedValueOnce(statistics);
    render(<StatisticsDashboard username="Carlos" />);

    expect(await screen.findByText("No se han podido calcular las estadísticas")).toBeVisible();
    await browserUser.click(screen.getByRole("button", { name: "Reintentar" }));

    expect(await screen.findByRole("heading", { name: "Así brinda Carlos" })).toBeVisible();
    expect(mocks.getBeerStatistics).toHaveBeenCalledTimes(2);
  });
});
