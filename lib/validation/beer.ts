import { z } from "zod";

export const MAX_BEER_TYPE_PHOTO_BYTES = 1_000_000;

export const addBeerSchema = z.object({
  beerTypeId: z.string().uuid("Selecciona un tipo de cerveza válido"),
});

export const createBeerTypeSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "El nombre es obligatorio")
    .max(50, "El nombre no puede superar 50 caracteres"),
  photoDataUrl: z
    .string()
    .max(1_400_000, "La foto no puede superar 1 MB")
    .regex(
      /^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/,
      "La foto debe ser una imagen JPG, PNG o WebP válida",
    ),
});

export type CreateBeerTypeInput = z.input<typeof createBeerTypeSchema>;
