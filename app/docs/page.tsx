import { ArrowLeft, Braces } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { Brand } from "@/components/layout/brand";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Documentación API" };

const endpoints = [
  ["POST", "/api/auth/register", "Crear una cuenta"],
  ["GET", "/api/users/me", "Usuario autenticado"],
  ["GET", "/api/users/ranking", "Clasificación general"],
  ["POST", "/api/beers", "Registrar una cerveza"],
  ["GET", "/api/beers/logs?page=0&size=20", "Historial paginado"],
] as const;

export default function ApiDocsPage() {
  return (
    <main className="min-h-dvh bg-background px-5 py-6 sm:px-8 sm:py-8">
      <div className="mx-auto max-w-4xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Brand />
          <Link className={cn(buttonVariants({ variant: "outline" }))} href="/">
            <ArrowLeft aria-hidden="true" className="size-4" />
            Volver
          </Link>
        </div>

        <div className="mb-8 mt-12 max-w-2xl space-y-3">
          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-primary">
            OpenAPI 3.1
          </p>
          <h1 className="font-display text-4xl font-extrabold tracking-tight">
            API de Cervecerdas
          </h1>
          <p className="leading-7 text-muted-foreground">
            Los endpoints privados usan la cookie de sesión JWT emitida por Auth.js. El
            inicio de sesión se realiza desde <code>/login</code>.
          </p>
          <a
            className={cn(buttonVariants({ variant: "secondary" }), "mt-2")}
            href="/api/openapi"
          >
            <Braces aria-hidden="true" className="size-4" />
            Ver especificación JSON
          </a>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Endpoints principales</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-border">
              {endpoints.map(([method, path, description]) => (
                <li className="grid gap-2 py-4 first:pt-0 sm:grid-cols-[5rem_1fr]" key={path}>
                  <span className="w-fit rounded-md bg-secondary px-2 py-1 font-mono text-xs font-bold text-secondary-foreground">
                    {method}
                  </span>
                  <div className="min-w-0">
                    <code className="break-all text-sm font-bold text-primary">{path}</code>
                    <p className="mt-1 text-sm text-muted-foreground">{description}</p>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
