"use client";

import { LoaderCircle } from "lucide-react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, useState } from "react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { loginSchema } from "@/lib/validation/auth";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    password?: string;
  }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const registered = searchParams.get("registered") === "1";
  const sessionExpired = searchParams.get("reason") === "expired";
  const requestedCallbackUrl = searchParams.get("callbackUrl");
  const callbackUrl =
    requestedCallbackUrl?.startsWith("/") &&
    !requestedCallbackUrl.startsWith("//")
      ? requestedCallbackUrl
      : "/home";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      const errors = parsed.error.flatten().fieldErrors;
      setFieldErrors({
        email: errors.email?.[0],
        password: errors.password?.[0],
      });
      setErrorMessage("Revisa los campos indicados para continuar");
      const firstField = parsed.error.issues[0]?.path[0];
      if (typeof firstField === "string") {
        document.getElementById(firstField)?.focus();
      }
      return;
    }

    setFieldErrors({});
    setIsSubmitting(true);

    try {
      const result = await signIn("credentials", {
        email: parsed.data.email,
        password: parsed.data.password,
        redirect: false,
      });

      if (!result?.ok) {
        setErrorMessage("El correo o la contraseña no son correctos");
        return;
      }

      router.replace(callbackUrl);
      router.refresh();
    } catch {
      setErrorMessage("No se ha podido conectar con el servidor");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="space-y-5" noValidate onSubmit={handleSubmit}>
      {registered ? (
        <Alert variant="success">Cuenta creada. Ya puedes iniciar sesión.</Alert>
      ) : null}
      {sessionExpired ? (
        <Alert>Tu sesión ha caducado. Inicia sesión de nuevo.</Alert>
      ) : null}
      {errorMessage ? <Alert>{errorMessage}</Alert> : null}

      <div className="space-y-2">
        <Label htmlFor="email">Correo electrónico</Label>
        <Input
          aria-describedby={fieldErrors.email ? "login-email-error" : undefined}
          aria-invalid={Boolean(fieldErrors.email)}
          autoComplete="email"
          id="email"
          inputMode="email"
          onChange={(event) => {
            setEmail(event.target.value);
            setErrorMessage(null);
            setFieldErrors((current) => ({ ...current, email: undefined }));
          }}
          required
          type="email"
          value={email}
        />
        {fieldErrors.email ? (
          <p className="text-sm text-destructive" id="login-email-error" role="alert">
            {fieldErrors.email}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Contraseña</Label>
        <PasswordInput
          aria-describedby={fieldErrors.password ? "login-password-error" : undefined}
          aria-invalid={Boolean(fieldErrors.password)}
          autoComplete="current-password"
          id="password"
          onChange={(event) => {
            setPassword(event.target.value);
            setErrorMessage(null);
            setFieldErrors((current) => ({ ...current, password: undefined }));
          }}
          required
          value={password}
        />
        {fieldErrors.password ? (
          <p className="text-sm text-destructive" id="login-password-error" role="alert">
            {fieldErrors.password}
          </p>
        ) : null}
      </div>

      <Button className="w-full" disabled={isSubmitting} size="lg" type="submit">
        {isSubmitting ? (
          <LoaderCircle aria-hidden="true" className="size-5 animate-spin" />
        ) : null}
        {isSubmitting ? "Entrando…" : "Entrar"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        ¿Aún no tienes cuenta?{" "}
        <Link
          className="inline-flex min-h-11 items-center font-bold text-primary underline-offset-4 hover:underline focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          href="/register"
        >
          Regístrate
        </Link>
      </p>
    </form>
  );
}
