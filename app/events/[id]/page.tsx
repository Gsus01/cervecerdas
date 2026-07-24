import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";

import { authOptions } from "@/lib/auth/options";
import { eventIdSchema } from "@/lib/validation/event";

interface EventPageProps {
  params: Promise<{ id: string }>;
}

export default async function EventPage({ params }: EventPageProps) {
  const session = await getServerSession(authOptions);
  if (!session?.user.id) {
    redirect("/login");
  }

  const parsedId = eventIdSchema.safeParse((await params).id);
  if (!parsedId.success) {
    notFound();
  }

  redirect(`/competition?eventId=${encodeURIComponent(parsedId.data)}`);
}
