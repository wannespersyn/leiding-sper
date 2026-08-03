import { requireAdminForPage } from "@/lib/auth/session";
import { getDashboardData } from "@/lib/data/dashboard";
import { AdminClient } from "./AdminClient";

export default async function AdminPage() {
  const session = await requireAdminForPage();
  const { people, categories } = await getDashboardData(session.accountId);

  return <AdminClient people={people} categories={categories} session={session} />;
}
