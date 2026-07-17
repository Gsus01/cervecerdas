import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/lib/auth/options";

export default async function RootPage() {
  const session = await getServerSession(authOptions);
  redirect(session?.user.id ? "/home" : "/login");
}
