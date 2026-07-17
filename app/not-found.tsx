import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center bg-background px-5 text-center">
      <div className="max-w-md space-y-5">
        <p className="font-display text-7xl font-black text-primary">404</p>
        <h1 className="font-display text-3xl font-extrabold">Esta ronda no existe</h1>
        <p className="leading-7 text-muted-foreground">
          La página que buscas se ha quedado fuera de la carta.
        </p>
        <Link className={cn(buttonVariants({ size: "lg" }))} href="/">
          Volver a Cervecerdas
        </Link>
      </div>
    </main>
  );
}
