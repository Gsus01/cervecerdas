import { z } from "zod";

export const eventIdSchema = z.string().uuid("El evento no es válido");

export const createEventSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "El nombre es obligatorio")
      .max(80, "El nombre no puede superar 80 caracteres"),
    startsAt: z
      .string()
      .datetime({ offset: true, message: "La fecha de inicio no es válida" }),
    endsAt: z
      .string()
      .datetime({ offset: true, message: "La fecha de fin no es válida" }),
  })
  .refine((input) => new Date(input.endsAt) > new Date(input.startsAt), {
    message: "La fecha de fin debe ser posterior al inicio",
    path: ["endsAt"],
  });

export const joinEventSchema = z.object({
  code: z
    .string()
    .trim()
    .toUpperCase()
    .length(10, "El código debe tener 10 caracteres")
    .regex(/^[A-Z0-9]+$/, "El código solo puede contener letras y números"),
});

export const eventDashboardQuerySchema = z.object({
  beerTypeIds: z
    .array(z.string().uuid("El tipo de bebida no es válido"))
    .max(20, "No se pueden filtrar más de 20 tipos de bebida")
    .transform((ids) => [...new Set(ids)])
    .default([]),
  page: z.coerce
    .number()
    .int("La página no es válida")
    .min(0, "La página no es válida")
    .default(0),
  size: z.coerce
    .number()
    .int("El tamaño de página no es válido")
    .min(1, "El tamaño de página no es válido")
    .max(50, "El tamaño de página no puede superar 50")
    .default(12),
  timeZone: z
    .string()
    .trim()
    .min(1)
    .max(100)
    .refine((timeZone) => {
      try {
        new Intl.DateTimeFormat("es-ES", { timeZone }).format();
        return true;
      } catch {
        return false;
      }
    }, "La zona horaria no es válida")
    .default("Europe/Madrid"),
});

export type CreateEventInput = z.infer<typeof createEventSchema>;
