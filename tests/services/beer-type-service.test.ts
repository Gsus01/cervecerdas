import { beforeEach, describe, expect, it, vi } from "vitest";

const databaseMock = vi.hoisted(() => ({
  select: vi.fn(),
  insert: vi.fn(),
}));

vi.mock("@/db", () => ({ db: databaseMock }));

import { createBeerType, getBeerTypes } from "@/lib/services/beer-type-service";

const storedBeerType = {
  id: "bf0dc4e4-1797-4ef8-9149-fe74d2ac1642",
  name: "IPA",
  photoDataUrl: "data:image/png;base64,aW1hZ2Vu",
  createdAt: new Date("2026-07-17T18:30:00.000Z"),
};

describe("beer-type-service", () => {
  beforeEach(() => {
    databaseMock.select.mockReset();
    databaseMock.insert.mockReset();
  });

  it("devuelve los tipos ordenados como DTO", async () => {
    const orderBy = vi.fn().mockResolvedValue([storedBeerType]);
    const from = vi.fn(() => ({ orderBy }));
    databaseMock.select.mockReturnValue({ from });

    await expect(getBeerTypes()).resolves.toEqual([
      {
        ...storedBeerType,
        createdAt: "2026-07-17T18:30:00.000Z",
      },
    ]);
  });

  it("normaliza y guarda nombre y foto", async () => {
    const returning = vi.fn().mockResolvedValue([storedBeerType]);
    const values = vi.fn(() => ({ returning }));
    databaseMock.insert.mockReturnValue({ values });

    const result = await createBeerType({
      name: "  IPA  ",
      photoDataUrl: storedBeerType.photoDataUrl,
    });

    expect(values).toHaveBeenCalledWith({
      name: "IPA",
      photoDataUrl: storedBeerType.photoDataUrl,
    });
    expect(result.createdAt).toBe("2026-07-17T18:30:00.000Z");
  });
});
