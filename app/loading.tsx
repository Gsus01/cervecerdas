import { Brand } from "@/components/layout/brand";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <main className="min-h-dvh bg-background px-5 py-6" aria-busy="true">
      <div className="mx-auto max-w-7xl">
        <Brand />
        <span className="sr-only">Cargando Cervecerdas…</span>
        <div className="mt-10 grid gap-5 lg:grid-cols-2">
          <Skeleton className="h-72" />
          <Skeleton className="h-72" />
        </div>
      </div>
    </main>
  );
}
