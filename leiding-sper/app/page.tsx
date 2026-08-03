import { requireSessionForPage } from "@/lib/auth/session";
import { getDashboardData } from "@/lib/data/dashboard";
import { HomeClient } from "./HomeClient";

export default async function HomePage() {
  const session = await requireSessionForPage();
  const { people, categories } = await getDashboardData(session.accountId);

  return <HomeClient people={people} categories={categories} session={session} />;
}
