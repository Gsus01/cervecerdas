import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  registerAccount: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push }),
}));
vi.mock("@/lib/http/api-client", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/http/api-client")>()),
  registerAccount: mocks.registerAccount,
}));

import { RegisterForm } from "@/components/auth/register-form";

describe("RegisterForm", () => {
  beforeEach(() => {
    mocks.push.mockReset();
    mocks.registerAccount.mockReset();
  });

  it("muestra los errores de validación junto a los campos", async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);

    await user.click(screen.getByRole("button", { name: "Crear mi cuenta" }));

    expect(screen.getByText("El nombre de usuario es obligatorio")).toBeVisible();
    expect(screen.getByText("El correo electrónico es obligatorio")).toBeVisible();
    expect(
      screen.getByText("La contraseña debe tener al menos 8 caracteres"),
    ).toBeVisible();
    expect(mocks.registerAccount).not.toHaveBeenCalled();
  });

  it("envía un formulario válido y redirige al login", async () => {
    const user = userEvent.setup();
    mocks.registerAccount.mockResolvedValue({});
    render(<RegisterForm />);

    await user.type(screen.getByLabelText("Nombre de usuario"), "Carlos");
    await user.type(screen.getByLabelText("Correo electrónico"), "carlos@example.com");
    await user.type(screen.getByLabelText("Contraseña"), "cerveza123");
    await user.type(screen.getByLabelText("Confirmar contraseña"), "cerveza123");
    await user.click(screen.getByRole("button", { name: "Crear mi cuenta" }));

    expect(mocks.registerAccount).toHaveBeenCalledWith({
      username: "Carlos",
      email: "carlos@example.com",
      password: "cerveza123",
      confirmPassword: "cerveza123",
    });
    expect(mocks.push).toHaveBeenCalledWith("/login?registered=1");
  });
});
