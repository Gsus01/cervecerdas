import "server-only";

import { asc } from "drizzle-orm";

import { db } from "@/db";
import { beerTypes, type BeerType } from "@/db/schema";
import { ConflictError } from "@/lib/http/errors";
import type { BeerTypeDto } from "@/lib/types/api";
import { createBeerTypeSchema } from "@/lib/validation/beer";

function toBeerTypeDto(beerType: BeerType): BeerTypeDto {
  return {
    id: beerType.id,
    name: beerType.name,
    photoDataUrl: beerType.photoDataUrl,
    createdAt: beerType.createdAt.toISOString(),
  };
}

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "23505"
  );
}

export async function getBeerTypes(): Promise<BeerTypeDto[]> {
  const rows = await db.select().from(beerTypes).orderBy(asc(beerTypes.name));
  return rows.map(toBeerTypeDto);
}

export async function createBeerType(input: unknown): Promise<BeerTypeDto> {
  const data = createBeerTypeSchema.parse(input);

  try {
    const [createdBeerType] = await db.insert(beerTypes).values(data).returning();

    if (!createdBeerType) {
      throw new Error("La base de datos no devolvió el tipo de cerveza creado");
    }

    return toBeerTypeDto(createdBeerType);
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new ConflictError("Ya existe un tipo de cerveza con ese nombre");
    }
    throw error;
  }
}
