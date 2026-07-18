// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth/session", () => ({
  getCurrentUserId: vi.fn(),
}));
vi.mock("@/lib/services/beer-service", () => ({
  addBeerForUser: vi.fn(),
}));
vi.mock("@/lib/services/beer-type-service", () => ({
  createBeerType: vi.fn(),
  getBeerTypes: vi.fn(),
}));
vi.mock("@/lib/services/user-service", () => ({
  getRanking: vi.fn(),
}));

import { POST as addBeerRoute } from "@/app/api/beers/route";
import {
  GET as getBeerTypesRoute,
  POST as createBeerTypeRoute,
} from "@/app/api/beer-types/route";
import { GET as rankingRoute } from "@/app/api/users/ranking/route";
import { getCurrentUserId } from "@/lib/auth/session";
import { UnauthorizedError } from "@/lib/http/errors";
import { addBeerForUser } from "@/lib/services/beer-service";
import { createBeerType, getBeerTypes } from "@/lib/services/beer-type-service";
import { getRanking } from "@/lib/services/user-service";
import type { BeerAddedDto, BeerTypeDto, RankingEntryDto } from "@/lib/types/api";

const getCurrentUserIdMock = vi.mocked(getCurrentUserId);
const addBeerForUserMock = vi.mocked(addBeerForUser);
const createBeerTypeMock = vi.mocked(createBeerType);
const getBeerTypesMock = vi.mocked(getBeerTypes);
const getRankingMock = vi.mocked(getRanking);
const userId = "4ddde027-2e19-49f6-a213-a93360e8b1fb";
const beerTypeId = "bf0dc4e4-1797-4ef8-9149-fe74d2ac1642";

describe("rutas protegidas", () => {
  beforeEach(() => {
    getCurrentUserIdMock.mockReset();
    addBeerForUserMock.mockReset();
    createBeerTypeMock.mockReset();
    getBeerTypesMock.mockReset();
    getRankingMock.mockReset();
  });

  it("rechaza registrar una cerveza sin sesión", async () => {
    getCurrentUserIdMock.mockRejectedValue(new UnauthorizedError());

    const response = await addBeerRoute(
      new Request("http://localhost/api/beers", { method: "POST" }),
    );

    expect(response.status).toBe(401);
    expect(addBeerForUserMock).not.toHaveBeenCalled();
  });

  it("registra la cerveza solo para la identidad de la sesión", async () => {
    const result: BeerAddedDto = {
      beerCount: 4,
      log: {
        id: "df32cc9b-bb38-4f40-aee4-953f92795f8c",
        userId,
        username: "Carlos",
        actionType: "BEER_ADDED",
        quantity: 1,
        beerType: {
          id: beerTypeId,
          name: "IPA",
          photoDataUrl: "data:image/png;base64,aW1hZ2Vu",
          createdAt: "2026-07-17T18:30:00.000Z",
        },
        createdAt: "2026-07-17T19:35:00.000Z",
      },
    };
    getCurrentUserIdMock.mockResolvedValue(userId);
    addBeerForUserMock.mockResolvedValue(result);

    const response = await addBeerRoute(
      new Request("http://localhost/api/beers", {
        method: "POST",
        body: JSON.stringify({ userId: "otro-usuario", beerTypeId }),
      }),
    );

    expect(response.status).toBe(201);
    expect(addBeerForUserMock).toHaveBeenCalledWith(userId, beerTypeId);
    expect(await response.json()).toEqual(result);
  });

  it("devuelve la clasificación ordenada del servicio", async () => {
    const ranking: RankingEntryDto[] = [
      { position: 1, userId, username: "Carlos", beerCount: 4 },
      {
        position: 2,
        userId: "56c42ff8-da51-4ea4-a8f9-e6b9db85015b",
        username: "Lucía",
        beerCount: 2,
      },
    ];
    getCurrentUserIdMock.mockResolvedValue(userId);
    getRankingMock.mockResolvedValue(ranking);

    const response = await rankingRoute(
      new Request("http://localhost/api/users/ranking"),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(ranking);
  });

  it("protege y devuelve el menú de tipos de cerveza", async () => {
    const beerTypes: BeerTypeDto[] = [
      {
        id: beerTypeId,
        name: "IPA",
        photoDataUrl: "data:image/png;base64,aW1hZ2Vu",
        createdAt: "2026-07-17T18:30:00.000Z",
      },
    ];
    getCurrentUserIdMock.mockResolvedValue(userId);
    getBeerTypesMock.mockResolvedValue(beerTypes);

    const response = await getBeerTypesRoute(
      new Request("http://localhost/api/beer-types"),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(beerTypes);
  });

  it("crea un tipo validado para una sesión autenticada", async () => {
    const input = {
      name: "IPA",
      photoDataUrl: "data:image/png;base64,aW1hZ2Vu",
    };
    const created: BeerTypeDto = {
      id: beerTypeId,
      ...input,
      createdAt: "2026-07-17T18:30:00.000Z",
    };
    getCurrentUserIdMock.mockResolvedValue(userId);
    createBeerTypeMock.mockResolvedValue(created);

    const response = await createBeerTypeRoute(
      new Request("http://localhost/api/beer-types", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    );

    expect(response.status).toBe(201);
    expect(createBeerTypeMock).toHaveBeenCalledWith(input);
    expect(await response.json()).toEqual(created);
  });
});
