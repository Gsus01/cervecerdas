import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { EventHub } from "@/components/events/event-hub";
import { AppHeader } from "@/components/layout/app-header";
import { authOptions } from "@/lib/auth/options";
import { getEventsForUser } from "@/lib/services/event-service";
import { getUserById } from "@/lib/services/user-service";

export const metadata: Metadata = {
  title: "Eventos",
};

interface EventsPageProps {
  searchParams: Promise<{ code?: string }>;
}

export default async function EventsPage({ searchParams }: EventsPageProps) {
  const query = await searchParams;
  const session = await getServerSession(authOptions);
  if (!session?.user.id) {
    const target = query.code
      ? `/events?code=${encodeURIComponent(query.code.slice(0, 10))}`
      : "/events";
    redirect(`/login?callbackUrl=${encodeURIComponent(target)}`);
  }

  const [user, events] = await Promise.all([
    getUserById(session.user.id),
    getEventsForUser(session.user.id),
  ]);

  return (
    <div className="min-h-dvh dashboard-background">
      <AppHeader username={user.username} />
      <main className="mx-auto max-w-7xl px-5 py-6 sm:px-8 sm:py-8">
        <EventHub
          initialCode={query.code?.slice(0, 10) ?? ""}
          initialEvents={events}
        />
      </main>
      <footer className="mx-auto max-w-7xl px-5 pb-8 pt-3 text-center text-xs text-muted-foreground sm:px-8">
        Cada quedada tiene su historia. Disfrutad con responsabilidad.
      </footer>
    </div>
  );
}
