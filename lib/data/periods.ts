import "server-only";
import { desc, eq, isNotNull, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { categories, entries, periods } from "@/db/schema";

export type ClosedPeriod = {
  id: string;
  name: string;
  closedAt: Date;
  totalPoints: number;
};

export async function getClosedPeriods(): Promise<ClosedPeriod[]> {
  const closed = await db
    .select()
    .from(periods)
    .where(isNotNull(periods.closedAt))
    .orderBy(desc(periods.closedAt));
  const cats = await db.select().from(categories);
  const catById = new Map(cats.map((c) => [c.id, c]));

  const result: ClosedPeriod[] = [];
  for (const p of closed) {
    const rows = await db
      .select({ categoryId: entries.categoryId, count: sql<number>`count(*)::int` })
      .from(entries)
      .where(eq(entries.periodId, p.id))
      .groupBy(entries.categoryId);
    let totalPoints = 0;
    for (const row of rows) {
      const cat = catById.get(row.categoryId);
      if (cat) totalPoints += row.count * cat.pointWeight;
    }
    result.push({ id: p.id, name: p.name, closedAt: p.closedAt!, totalPoints });
  }
  return result;
}
