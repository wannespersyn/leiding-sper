import { requireSessionForPage } from "@/lib/auth/session";
import { getDashboardData } from "@/lib/data/dashboard";
import { HomeClient } from "./HomeClient";

export default async function HomePage() {
  const session = await requireSessionForPage();
  const { people } = await getDashboardData(session.accountId);

  return <HomeClient people={people} session={session} />;
}
