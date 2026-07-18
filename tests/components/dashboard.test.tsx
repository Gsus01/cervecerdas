import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  addBeer: vi.fn(),
  createBeerType: vi.fn(),
  getRanking: vi.fn(),
  getBeerLogs: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock("next-auth/react", () => ({ signOut: mocks.signOut }));
vi.mock("@/lib/http/api-client", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/http/api-client")>()),
  addBeer: mocks.addBeer,
  createBeerType: mocks.createBeerType,
  getRanking: mocks.getRanking,
  getBeerLogs: mocks.getBeerLogs,
}));

import { Dashboard } from "@/components/dashboard/dashboard";
import { ApiClientError } from "@/lib/http/api-client";
import type {
  BeerLogDto,
  BeerTypeDto,
  PageDto,
  RankingEntryDto,
  UserDto,
} from "@/lib/types/api";

const user: UserDto = {
  id: "4ddde027-2e19-49f6-a213-a93360e8b1fb",
  username: "Carlos",
  email: "carlos@example.com",
  beerCount: 3,
  createdAt: "2026-07-17T18:00:00.000Z",
  updatedAt: "2026-07-17T18:00:00.000Z",
};
const ranking: RankingEntryDto[] = [
  { position: 1, userId: user.id, username: "Carlos", beerCount: 3 },
];
const logs: PageDto<BeerLogDto> = {
  content: [],
  page: 0,
  size: 20,
  totalElements: 0,
  totalPages: 0,
};
const beerType: BeerTypeDto = {
  id: "bf0dc4e4-1797-4ef8-9149-fe74d2ac1642",
  name: "IPA",
  photoDataUrl: "data:image/png;base64,aW1hZ2Vu",
  createdAt: "2026-07-17T18:30:00.000Z",
};

function renderDashboard(initialBeerTypes: BeerTypeDto[] = [beerType]) {
  return render(
    <Dashboard
      initialBeerTypes={initialBeerTypes}
      initialLogs={logs}
      initialRanking={ranking}
      initialUser={user}
    />,
  );
}

describe("Dashboard", () => {
  beforeEach(() => {
    mocks.addBeer.mockReset();
    mocks.createBeerType.mockReset();
    mocks.getRanking.mockReset();
    mocks.getBeerLogs.mockReset();
    mocks.signOut.mockReset();
  });

  it("renderiza el contador actual", () => {
    renderDashboard();

    expect(screen.getByLabelText("3 cervezas registradas")).toBeVisible();
    expect(screen.getByText("Hola, Carlos")).toBeVisible();
  });

  it("registra una cerveza y actualiza el contador sin recargar", async () => {
    const browserUser = userEvent.setup();
    const newLog: BeerLogDto = {
      id: "df32cc9b-bb38-4f40-aee4-953f92795f8c",
      userId: user.id,
      username: "Carlos",
      actionType: "BEER_ADDED",
      quantity: 1,
      beerType,
      createdAt: "2026-07-17T19:35:00.000Z",
    };
    mocks.addBeer.mockResolvedValue({ beerCount: 4, log: newLog });
    mocks.getRanking.mockResolvedValue([
      { position: 1, userId: user.id, username: "Carlos", beerCount: 4 },
    ]);
    mocks.getBeerLogs.mockResolvedValue({
      ...logs,
      content: [newLog],
      totalElements: 1,
      totalPages: 1,
    });
    renderDashboard();

    await browserUser.selectOptions(screen.getByLabelText("Tipo de cerveza"), beerType.id);
    await browserUser.click(screen.getByRole("button", { name: "Registrar cerveza" }));

    expect(await screen.findByLabelText("4 cervezas registradas")).toBeVisible();
    expect(screen.getByText("Cerveza registrada. ¡Salud!")).toBeVisible();
    expect(mocks.addBeer).toHaveBeenCalledWith(beerType.id);
  });

  it("mantiene el contador y muestra el error de la API", async () => {
    const browserUser = userEvent.setup();
    mocks.addBeer.mockRejectedValue(
      new ApiClientError(500, {
        timestamp: "2026-07-17T19:35:00.000Z",
        status: 500,
        error: "Internal server error",
        message: "No se ha podido registrar la cerveza",
        path: "/api/beers",
      }),
    );
    renderDashboard();

    await browserUser.selectOptions(screen.getByLabelText("Tipo de cerveza"), beerType.id);
    await browserUser.click(screen.getByRole("button", { name: "Registrar cerveza" }));

    expect(await screen.findByText("No se ha podido registrar la cerveza")).toBeVisible();
    expect(screen.getByLabelText("3 cervezas registradas")).toBeVisible();
  });

  it("añade un tipo desde el menú y lo deja seleccionado", async () => {
    const browserUser = userEvent.setup();
    const createdBeerType: BeerTypeDto = { ...beerType, name: "Lager" };
    mocks.createBeerType.mockResolvedValue(createdBeerType);
    renderDashboard([]);

    await browserUser.click(screen.getByRole("button", { name: "Tipos de cerveza" }));
    await browserUser.type(screen.getByLabelText("Nombre"), "Lager");
    await browserUser.upload(
      screen.getByLabelText("Foto"),
      new File(["imagen"], "lager.png", { type: "image/png" }),
    );
    await screen.findByAltText("Vista previa del tipo de cerveza");
    await browserUser.click(screen.getByRole("button", { name: "Añadir tipo" }));

    expect(mocks.createBeerType).toHaveBeenCalledWith(
      "Lager",
      "data:image/png;base64,aW1hZ2Vu",
    );
    expect(screen.getByLabelText("Tipo de cerveza")).toHaveValue(beerType.id);
    expect(screen.getByText("Tipo Lager añadido")).toBeVisible();
  });
});
