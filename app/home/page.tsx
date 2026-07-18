import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { Dashboard } from "@/components/dashboard/dashboard";
import { authOptions } from "@/lib/auth/options";
import { getBeerTypes } from "@/lib/services/beer-type-service";
import { getBeerLogs } from "@/lib/services/beer-service";
import { getRanking, getUserById } from "@/lib/services/user-service";

export const metadata: Metadata = {
  title: "Mi contador",
};

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user.id) {
    redirect("/login");
  }

  const [user, ranking, logs, beerTypes] = await Promise.all([
    getUserById(session.user.id),
    getRanking(),
    getBeerLogs(0, 20),
    getBeerTypes(),
  ]);

  return (
    <Dashboard
      initialBeerTypes={beerTypes}
      initialLogs={logs}
      initialRanking={ranking}
      initialUser={user}
    />
  );
}
