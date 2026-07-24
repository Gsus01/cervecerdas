// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth/session", () => ({
  getCurrentUserId: vi.fn(),
}));
vi.mock("@/lib/services/beer-type-service", () => ({
  createBeerType: vi.fn(),
  getBeerTypes: vi.fn(),
}));

import {
  GET as getBeerTypesRoute,
  POST as createBeerTypeRoute,
} from "@/app/api/beer-types/route";
import { getCurrentUserId } from "@/lib/auth/session";
import { UnauthorizedError } from "@/lib/http/errors";
import { createBeerType, getBeerTypes } from "@/lib/services/beer-type-service";
import type { BeerTypeDto } from "@/lib/types/api";

const getCurrentUserIdMock = vi.mocked(getCurrentUserId);
const createBeerTypeMock = vi.mocked(createBeerType);
const getBeerTypesMock = vi.mocked(getBeerTypes);
const userId = "4ddde027-2e19-49f6-a213-a93360e8b1fb";
const beerTypeId = "bf0dc4e4-1797-4ef8-9149-fe74d2ac1642";

describe("rutas protegidas", () => {
  beforeEach(() => {
    getCurrentUserIdMock.mockReset();
    createBeerTypeMock.mockReset();
    getBeerTypesMock.mockReset();
  });

  it("protege y devuelve el catálogo de tipos de bebida", async () => {
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
    expect(getCurrentUserIdMock).toHaveBeenCalledOnce();
    expect(createBeerTypeMock).toHaveBeenCalledWith(input);
    expect(await response.json()).toEqual(created);
  });

  it("rechaza crear un tipo de bebida sin sesión", async () => {
    getCurrentUserIdMock.mockRejectedValue(new UnauthorizedError());

    const response = await createBeerTypeRoute(
      new Request("http://localhost/api/beer-types", {
        method: "POST",
        body: JSON.stringify({
          name: "Limonada",
          photoDataUrl: "data:image/png;base64,aW1hZ2Vu",
        }),
      }),
    );

    expect(response.status).toBe(401);
    expect(createBeerTypeMock).not.toHaveBeenCalled();
  });
});
