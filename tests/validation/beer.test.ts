import { describe, expect, it } from "vitest";

import { addBeerSchema, createBeerTypeSchema } from "@/lib/validation/beer";

describe("validación de cervezas", () => {
  it("exige un tipo válido al registrar", () => {
    expect(addBeerSchema.safeParse({ beerTypeId: "no-es-uuid" }).success).toBe(false);
  });

  it("acepta un tipo con nombre y foto segura", () => {
    expect(
      createBeerTypeSchema.parse({
        name: "  Lager  ",
        photoDataUrl: "data:image/webp;base64,aW1hZ2Vu",
      }),
    ).toEqual({
      name: "Lager",
      photoDataUrl: "data:image/webp;base64,aW1hZ2Vu",
    });
  });

  it("rechaza formatos de imagen no permitidos", () => {
    expect(
      createBeerTypeSchema.safeParse({
        name: "Lager",
        photoDataUrl: "data:image/svg+xml;base64,aW1hZ2Vu",
      }).success,
    ).toBe(false);
  });
});
