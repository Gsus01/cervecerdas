import { Beer } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils";

interface BrandProps {
  className?: string;
  inverse?: boolean;
}

export function Brand({ className, inverse = false }: BrandProps) {
  return (
    <Link
      aria-label="Cervecerdas, ir al inicio"
      className={cn(
        "inline-flex min-h-11 items-center gap-2 rounded-lg font-display text-xl font-extrabold tracking-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        inverse ? "text-white" : "text-foreground",
        className,
      )}
      href="/"
    >
      <span
        className={cn(
          "grid size-9 place-items-center rounded-lg",
          inverse ? "bg-white/15" : "bg-accent text-accent-foreground",
        )}
      >
        <Beer aria-hidden="true" className="size-5" strokeWidth={2.4} />
      </span>
      <span className="min-w-0 truncate">Cervecerdas</span>
    </Link>
  );
}
