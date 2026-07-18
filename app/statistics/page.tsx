import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { AppHeader } from "@/components/layout/app-header";
import { StatisticsDashboard } from "@/components/statistics/statistics-dashboard";
import { authOptions } from "@/lib/auth/options";
import { getUserById } from "@/lib/services/user-service";

export const metadata: Metadata = {
  title: "Mis estadísticas",
};

export default async function StatisticsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user.id) {
    redirect("/login");
  }

  const user = await getUserById(session.user.id);

  return (
    <div className="min-h-dvh dashboard-background">
      <AppHeader activePage="statistics" username={user.username} />
      <main className="mx-auto max-w-7xl px-5 py-6 sm:px-8 sm:py-8">
        <StatisticsDashboard username={user.username} />
      </main>
      <footer className="mx-auto max-w-7xl px-5 pb-8 pt-3 text-center text-xs text-muted-foreground sm:px-8">
        Los datos cuentan tu historia. Disfruta con responsabilidad.
      </footer>
    </div>
  );
}
