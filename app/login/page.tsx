import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";
import { Skeleton } from "@/components/ui/skeleton";
import { authOptions } from "@/lib/auth/options";

export const metadata: Metadata = {
  title: "Iniciar sesión",
};

export default async function LoginPage() {
  const session = await getServerSession(authOptions);
  if (session?.user.id) {
    redirect("/home");
  }

  return (
    <AuthShell
      description="Vuelve a tu contador, revisa el ranking y registra la siguiente."
      eyebrow="Bienvenido de vuelta"
      title="Inicia sesión"
    >
      <Suspense fallback={<Skeleton className="h-80" />}>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
