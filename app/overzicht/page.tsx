import { requireSessionForPage } from "@/lib/auth/session";
import { getDashboardData, getDayBreakdown } from "@/lib/data/dashboard";
import { OverzichtClient } from "./OverzichtClient";

export default async function OverzichtPage() {
  const session = await requireSessionForPage();
  const { people, period } = await getDashboardData(session.accountId);
  const dayBreakdown = await getDayBreakdown(period.id);

  return (
    <OverzichtClient
      people={people}
      period={period}
      dayBreakdown={dayBreakdown}
      session={session}
    />
  );
}
