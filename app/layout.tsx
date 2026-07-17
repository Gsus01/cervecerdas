import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Cervecerdas",
    template: "%s · Cervecerdas",
  },
  description: "Cuenta cervezas, comparte el historial y lidera la clasificación.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#fbf8f1",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="es">
      <body>
        <a
          className="fixed left-4 top-4 z-50 -translate-y-24 rounded-lg bg-secondary px-4 py-3 font-bold text-secondary-foreground shadow-lg transition-transform duration-200 focus:translate-y-0 focus:outline-none focus:ring-2 focus:ring-ring"
          href="#main-content"
        >
          Saltar al contenido
        </a>
        <div id="main-content" tabIndex={-1}>
          {children}
        </div>
      </body>
    </html>
  );
}
