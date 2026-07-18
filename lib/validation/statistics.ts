import { z } from "zod";

function isTimeZone(value: string): boolean {
  try {
    new Intl.DateTimeFormat("es-ES", { timeZone: value }).format();
    return true;
  } catch {
    return false;
  }
}

export const statisticsTimeZoneSchema = z
  .string()
  .trim()
  .min(1, "La zona horaria es obligatoria")
  .max(100, "La zona horaria es demasiado larga")
  .refine(isTimeZone, "La zona horaria no es válida")
  .default("UTC");
