import { requireAdminForPage } from "@/lib/auth/session";
import { getDashboardData } from "@/lib/data/dashboard";
import { getClosedPeriods } from "@/lib/data/periods";
import { getPendingPayments } from "@/lib/data/payments";
import { AdminClient } from "./AdminClient";

export default async function AdminPage() {
  const session = await requireAdminForPage();
  const { people, categories, period } = await getDashboardData(session.accountId);
  const closedPeriods = await getClosedPeriods();
  const pendingPayments = await getPendingPayments();

  return (
    <AdminClient
      people={people}
      categories={categories}
      period={period}
      closedPeriods={closedPeriods}
      pendingPayments={pendingPayments}
      session={session}
    />
  );
}
