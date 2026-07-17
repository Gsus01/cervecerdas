import { BarChart3, History, ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";

import { Brand } from "@/components/layout/brand";

interface AuthShellProps {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}

const benefits = [
  { icon: BarChart3, text: "Tu contador siempre al día" },
  { icon: History, text: "Un historial claro y compartido" },
  { icon: ShieldCheck, text: "Sesiones seguras y privadas" },
];

export function AuthShell({
  eyebrow,
  title,
  description,
  children,
}: AuthShellProps) {
  return (
    <main className="min-h-dvh bg-background lg:grid lg:grid-cols-[minmax(0,0.9fr)_minmax(520px,1.1fr)]">
      <section className="relative hidden min-h-dvh overflow-hidden bg-secondary p-12 text-secondary-foreground lg:flex lg:flex-col lg:justify-between xl:p-16">
        <div className="auth-bubble auth-bubble-one" />
        <div className="auth-bubble auth-bubble-two" />
        <Brand inverse />

        <div className="relative z-10 max-w-lg space-y-7">
          <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-accent">
            Una ronda, un registro
          </p>
          <h2 className="font-display text-5xl font-extrabold leading-[1.05] tracking-tight xl:text-6xl">
            Menos cuentas.
            <br />
            Más historias.
          </h2>
          <p className="max-w-md text-lg leading-8 text-white/75">
            Lleva la cuenta con tus amigos y descubre quién lidera la clasificación.
          </p>
          <ul className="grid gap-3" aria-label="Ventajas de Cervecerdas">
            {benefits.map(({ icon: Icon, text }) => (
              <li className="flex items-center gap-3 text-sm font-semibold" key={text}>
                <span className="grid size-9 place-items-center rounded-lg bg-white/10">
                  <Icon aria-hidden="true" className="size-4 text-accent" />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative z-10 text-xs text-white/55">
          Disfruta con responsabilidad.
        </p>
      </section>

      <section className="flex min-h-dvh items-center justify-center px-5 py-8 sm:px-8 lg:py-12">
        <div className="w-full max-w-md">
          <Brand className="mb-10 lg:hidden" />
          <div className="mb-8 space-y-3">
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-primary">
              {eyebrow}
            </p>
            <h1 className="font-display text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
              {title}
            </h1>
            <p className="leading-7 text-muted-foreground">{description}</p>
          </div>
          {children}
        </div>
      </section>
    </main>
  );
}
