import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { CompetitionDashboard } from "@/components/competition/competition-dashboard";
import { authOptions } from "@/lib/auth/options";
import { getBeerTypes } from "@/lib/services/beer-type-service";
import {
  getEventDashboard,
  getEventsForUser,
} from "@/lib/services/event-service";
import { getUserById } from "@/lib/services/user-service";

export const metadata: Metadata = {
  title: "Análisis del evento",
};

interface CompetitionPageProps {
  searchParams: Promise<{ eventId?: string }>;
}

export default async function CompetitionPage({
  searchParams,
}: CompetitionPageProps) {
  const session = await getServerSession(authOptions);
  if (!session?.user.id) {
    redirect("/login");
  }

  const [{ eventId }, user, events, beerTypes] = await Promise.all([
    searchParams,
    getUserById(session.user.id),
    getEventsForUser(session.user.id),
    getBeerTypes(),
  ]);
  const selectedEvent =
    events.find((event) => event.id === eventId) ??
    events.find((event) => event.status === "ACTIVE") ??
    [...events]
      .filter((event) => event.status === "UPCOMING")
      .sort(
        (first, second) =>
          new Date(first.startsAt).getTime() -
          new Date(second.startsAt).getTime(),
      )[0] ??
    events[0] ??
    null;
  const dashboard = selectedEvent
    ? await getEventDashboard(
        selectedEvent.id,
        session.user.id,
        "Europe/Madrid",
      )
    : null;

  return (
    <CompetitionDashboard
      beerTypes={beerTypes}
      currentUserId={user.id}
      events={events}
      initialDashboard={dashboard}
      username={user.username}
    />
  );
}
