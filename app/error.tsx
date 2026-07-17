"use client";

import { RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function GlobalError({ reset }: { reset: () => void }) {
  return (
    <main className="grid min-h-dvh place-items-center bg-background px-5 text-center">
      <div className="max-w-md space-y-5">
        <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-primary">
          Algo no ha ido bien
        </p>
        <h1 className="font-display text-3xl font-extrabold tracking-tight">
          No hemos podido servir esta ronda
        </h1>
        <p className="leading-7 text-muted-foreground">
          Inténtalo de nuevo. Si el problema continúa, comprueba que la base de datos
          esté disponible.
        </p>
        <Button onClick={reset} size="lg">
          <RotateCcw aria-hidden="true" className="size-4" />
          Reintentar
        </Button>
      </div>
    </main>
  );
}
