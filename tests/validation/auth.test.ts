import { describe, expect, it } from "vitest";

import { registrationSchema } from "@/lib/validation/auth";

describe("registrationSchema", () => {
  it("acepta un registro correcto y normaliza el correo", () => {
    const result = registrationSchema.parse({
      username: "Carlos_7",
      email: "  CARLOS@example.com ",
      password: "cerveza123",
      confirmPassword: "cerveza123",
    });

    expect(result.email).toBe("carlos@example.com");
    expect(result.username).toBe("Carlos_7");
  });

  it("rechaza un correo no válido y una contraseña corta", () => {
    const result = registrationSchema.safeParse({
      username: "Carlos",
      email: "correo-invalido",
      password: "corta",
      confirmPassword: "corta",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const fields = result.error.flatten().fieldErrors;
      expect(fields.email?.[0]).toBe("El correo electrónico no es válido");
      expect(fields.password?.[0]).toBe(
        "La contraseña debe tener al menos 8 caracteres",
      );
    }
  });

  it("rechaza contraseñas que no coinciden", () => {
    const result = registrationSchema.safeParse({
      username: "Carlos",
      email: "carlos@example.com",
      password: "cerveza123",
      confirmPassword: "cerveza456",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.confirmPassword?.[0]).toBe(
        "Las contraseñas no coinciden",
      );
    }
  });
});
