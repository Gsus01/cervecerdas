import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { AuthShell } from "@/components/auth/auth-shell";
import { RegisterForm } from "@/components/auth/register-form";
import { authOptions } from "@/lib/auth/options";

export const metadata: Metadata = {
  title: "Crear cuenta",
};

export default async function RegisterPage() {
  const session = await getServerSession(authOptions);
  if (session?.user.id) {
    redirect("/home");
  }

  return (
    <AuthShell
      description="Crea tu perfil y empieza a registrar cada ronda."
      eyebrow="Tu primera ronda"
      title="Crea una cuenta"
    >
      <RegisterForm />
    </AuthShell>
  );
}
