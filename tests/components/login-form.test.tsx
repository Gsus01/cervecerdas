import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  signIn: vi.fn(),
  replace: vi.fn(),
  refresh: vi.fn(),
  searchParams: new URLSearchParams(),
}));

vi.mock("next-auth/react", () => ({ signIn: mocks.signIn }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mocks.replace, refresh: mocks.refresh }),
  useSearchParams: () => mocks.searchParams,
}));

import { LoginForm } from "@/components/auth/login-form";

describe("LoginForm", () => {
  beforeEach(() => {
    mocks.signIn.mockReset();
    mocks.replace.mockReset();
    mocks.refresh.mockReset();
    mocks.searchParams = new URLSearchParams();
  });

  it("vuelve a la invitación interna después de iniciar sesión", async () => {
    const user = userEvent.setup();
    mocks.searchParams = new URLSearchParams(
      "callbackUrl=%2Fevents%3Fcode%3DABC123DEFG",
    );
    mocks.signIn.mockResolvedValue({ ok: true });
    render(<LoginForm />);

    await user.type(screen.getByLabelText("Correo electrónico"), "carlos@example.com");
    await user.type(screen.getByLabelText("Contraseña"), "cerveza123");
    await user.click(screen.getByRole("button", { name: "Entrar" }));

    await waitFor(() => {
      expect(mocks.replace).toHaveBeenCalledWith("/events?code=ABC123DEFG");
    });
  });

  it("inicia sesión y entra en el dashboard", async () => {
    const user = userEvent.setup();
    mocks.signIn.mockResolvedValue({ ok: true });
    render(<LoginForm />);

    await user.type(screen.getByLabelText("Correo electrónico"), "carlos@example.com");
    await user.type(screen.getByLabelText("Contraseña"), "cerveza123");
    await user.click(screen.getByRole("button", { name: "Entrar" }));

    await waitFor(() => {
      expect(mocks.signIn).toHaveBeenCalledWith("credentials", {
        email: "carlos@example.com",
        password: "cerveza123",
        redirect: false,
      });
      expect(mocks.replace).toHaveBeenCalledWith("/home");
    });
  });

  it("informa cuando las credenciales son incorrectas", async () => {
    const user = userEvent.setup();
    mocks.signIn.mockResolvedValue({ ok: false, error: "CredentialsSignin" });
    render(<LoginForm />);

    await user.type(screen.getByLabelText("Correo electrónico"), "carlos@example.com");
    await user.type(screen.getByLabelText("Contraseña"), "incorrecta");
    await user.click(screen.getByRole("button", { name: "Entrar" }));

    expect(
      await screen.findByText("El correo o la contraseña no son correctos"),
    ).toBeVisible();
  });
});
