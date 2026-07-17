"use client";

import { LoaderCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import type { ZodError } from "zod";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { ApiClientError, registerAccount } from "@/lib/http/api-client";
import {
  registrationSchema,
  type RegistrationInput,
} from "@/lib/validation/auth";

type FieldName = keyof RegistrationInput;
type FieldErrors = Partial<Record<FieldName, string>>;

const initialValues: RegistrationInput = {
  username: "",
  email: "",
  password: "",
  confirmPassword: "",
};

function mapZodErrors(error: ZodError): FieldErrors {
  const errors: FieldErrors = {};
  for (const issue of error.issues) {
    const field = issue.path[0];
    if (typeof field === "string" && field in initialValues && !errors[field as FieldName]) {
      errors[field as FieldName] = issue.message;
    }
  }
  return errors;
}

function mapApiFieldErrors(
  errors: Record<string, string[]> | undefined,
): FieldErrors {
  if (!errors) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(errors)
      .filter(([field, messages]) => field in initialValues && messages[0])
      .map(([field, messages]) => [field, messages[0]]),
  ) as FieldErrors;
}

export function RegisterForm() {
  const router = useRouter();
  const [values, setValues] = useState<RegistrationInput>(initialValues);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField(field: FieldName, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setFormError(null);
    if (fieldErrors[field]) {
      setFieldErrors((current) => ({ ...current, [field]: undefined }));
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const parsed = registrationSchema.safeParse(values);
    if (!parsed.success) {
      const errors = mapZodErrors(parsed.error);
      setFieldErrors(errors);
      setFormError("Revisa los campos indicados para continuar");
      const firstField = parsed.error.issues[0]?.path[0];
      if (typeof firstField === "string") {
        document.getElementById(firstField)?.focus();
      }
      return;
    }

    setFieldErrors({});
    setIsSubmitting(true);

    try {
      await registerAccount(parsed.data);
      router.push("/login?registered=1");
    } catch (error) {
      if (error instanceof ApiClientError) {
        const errors = mapApiFieldErrors(error.details.fieldErrors);
        setFieldErrors(errors);
        setFormError(error.message);
        const firstField = Object.keys(errors)[0];
        if (firstField) {
          document.getElementById(firstField)?.focus();
        }
      } else {
        setFormError("No se ha podido crear la cuenta. Inténtalo de nuevo.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="space-y-5" noValidate onSubmit={handleSubmit}>
      {formError ? <Alert>{formError}</Alert> : null}

      <div className="space-y-2">
        <Label htmlFor="username">Nombre de usuario</Label>
        <Input
          aria-describedby={fieldErrors.username ? "username-error" : "username-help"}
          aria-invalid={Boolean(fieldErrors.username)}
          autoComplete="username"
          id="username"
          maxLength={50}
          onChange={(event) => updateField("username", event.target.value)}
          required
          value={values.username}
        />
        {fieldErrors.username ? (
          <p className="text-sm text-destructive" id="username-error" role="alert">
            {fieldErrors.username}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground" id="username-help">
            Letras, números, puntos, guiones o guiones bajos.
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Correo electrónico</Label>
        <Input
          aria-describedby={fieldErrors.email ? "email-error" : undefined}
          aria-invalid={Boolean(fieldErrors.email)}
          autoComplete="email"
          id="email"
          inputMode="email"
          onChange={(event) => updateField("email", event.target.value)}
          required
          type="email"
          value={values.email}
        />
        {fieldErrors.email ? (
          <p className="text-sm text-destructive" id="email-error" role="alert">
            {fieldErrors.email}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Contraseña</Label>
        <PasswordInput
          aria-describedby={fieldErrors.password ? "password-error" : "password-help"}
          aria-invalid={Boolean(fieldErrors.password)}
          autoComplete="new-password"
          id="password"
          onChange={(event) => updateField("password", event.target.value)}
          required
          value={values.password}
        />
        {fieldErrors.password ? (
          <p className="text-sm text-destructive" id="password-error" role="alert">
            {fieldErrors.password}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground" id="password-help">
            Mínimo 8 caracteres.
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
        <PasswordInput
          aria-describedby={fieldErrors.confirmPassword ? "confirm-password-error" : undefined}
          aria-invalid={Boolean(fieldErrors.confirmPassword)}
          autoComplete="new-password"
          id="confirmPassword"
          onChange={(event) => updateField("confirmPassword", event.target.value)}
          required
          value={values.confirmPassword}
        />
        {fieldErrors.confirmPassword ? (
          <p className="text-sm text-destructive" id="confirm-password-error" role="alert">
            {fieldErrors.confirmPassword}
          </p>
        ) : null}
      </div>

      <Button className="w-full" disabled={isSubmitting} size="lg" type="submit">
        {isSubmitting ? (
          <LoaderCircle aria-hidden="true" className="size-5 animate-spin" />
        ) : null}
        {isSubmitting ? "Creando cuenta…" : "Crear mi cuenta"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        ¿Ya tienes una cuenta?{" "}
        <Link
          className="inline-flex min-h-11 items-center font-bold text-primary underline-offset-4 hover:underline focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          href="/login"
        >
          Inicia sesión
        </Link>
      </p>
    </form>
  );
}
