import "server-only";
import { and, eq, isNull, isNotNull } from "drizzle-orm";
import { db } from "@/db/client";
import { payments, periods, persons } from "@/db/schema";

export type PendingPayment = {
  personId: string;
  personName: string;
  periodId: string;
  periodName: string;
  markedPaidAt: Date;
};

export async function getPendingPayments(): Promise<PendingPayment[]> {
  const rows = await db
    .select({
      personId: persons.id,
      personName: persons.name,
      periodId: periods.id,
      periodName: periods.name,
      markedPaidAt: payments.markedPaidAt,
    })
    .from(payments)
    .innerJoin(persons, eq(payments.personId, persons.id))
    .innerJoin(periods, eq(payments.periodId, periods.id))
    .where(and(isNotNull(payments.markedPaidAt), isNull(payments.confirmedAt)));

  return rows
    .filter((r): r is PendingPayment => r.markedPaidAt !== null)
    .sort((a, b) => a.markedPaidAt.getTime() - b.markedPaidAt.getTime());
}
