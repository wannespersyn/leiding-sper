import "server-only";
import { eq, isNull, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { categories, entries, favorites, periods, persons } from "@/db/schema";

export type CategorySummary = {
  id: string;
  key: "bier" | "cocktail";
  label: string;
  pointWeight: number;
  priceLeidingCents: number;
  priceExternCents: number;
};

export type CurrentPeriod = {
  id: string;
  name: string;
  startedAt: Date;
};

export type PersonSummary = {
  id: string;
  name: string;
  type: "leiding" | "extern" | "scouts";
  isAdmin: boolean;
  bierCount: number;
  cocktailCount: number;
  totalPoints: number;
  amountCents: number | null;
  isFavorite: boolean;
};

export async function getCategories(): Promise<CategorySummary[]> {
  return db.select().from(categories).orderBy(categories.key);
}

export async function getCurrentPeriod(): Promise<CurrentPeriod> {
  const [period] = await db
    .select()
    .from(periods)
    .where(isNull(periods.closedAt))
    .limit(1);
  if (!period) {
    throw new Error("No open period - run the seed script first.");
  }
  return period;
}

export async function getDashboardData(accountId: string): Promise<{
  people: PersonSummary[];
  categories: CategorySummary[];
  period: CurrentPeriod;
}> {
  const cats = await getCategories();
  const period = await getCurrentPeriod();
  const catById = new Map(cats.map((c) => [c.id, c]));

  const allPersons = await db.select().from(persons).orderBy(persons.name);

  const openCounts = await db
    .select({
      personId: entries.personId,
      categoryId: entries.categoryId,
      count: sql<number>`count(*)::int`,
    })
    .from(entries)
    .where(eq(entries.periodId, period.id))
    .groupBy(entries.personId, entries.categoryId);

  const favRows = await db
    .select({ personId: favorites.personId })
    .from(favorites)
    .where(eq(favorites.accountId, accountId));
  const favSet = new Set(favRows.map((r) => r.personId));

  const countsByPerson = new Map<
    string,
    { bierCount: number; cocktailCount: number; totalPoints: number; amountCents: number }
  >();

  for (const row of openCounts) {
    const category = catById.get(row.categoryId);
    if (!category) continue;
    const current = countsByPerson.get(row.personId) ?? {
      bierCount: 0,
      cocktailCount: 0,
      totalPoints: 0,
      amountCents: 0,
    };
    if (category.key === "bier") current.bierCount += row.count;
    if (category.key === "cocktail") current.cocktailCount += row.count;
    current.totalPoints += row.count * category.pointWeight;
    countsByPerson.set(row.personId, current);
  }

  const people: PersonSummary[] = allPersons.map((person) => {
    const counts = countsByPerson.get(person.id);
    let amountCents: number | null = null;
    if (person.type !== "scouts") {
      amountCents = 0;
      for (const row of openCounts.filter((r) => r.personId === person.id)) {
        const category = catById.get(row.categoryId);
        if (!category) continue;
        const price =
          person.type === "extern"
            ? category.priceExternCents
            : category.priceLeidingCents;
        amountCents += row.count * price;
      }
    }

    return {
      id: person.id,
      name: person.name,
      type: person.type,
      isAdmin: person.isAdmin,
      bierCount: counts?.bierCount ?? 0,
      cocktailCount: counts?.cocktailCount ?? 0,
      totalPoints: counts?.totalPoints ?? 0,
      amountCents,
      isFavorite: favSet.has(person.id),
    };
  });

  return { people, categories: cats, period };
}

export type DayBreakdownEntry = {
  date: string;
  points: number;
  bierCount: number;
  cocktailCount: number;
};

export async function getDayBreakdown(
  periodId: string,
): Promise<DayBreakdownEntry[]> {
  const cats = await getCategories();
  const catById = new Map(cats.map((c) => [c.id, c]));

  const rows = await db
    .select({
      date: sql<string>`to_char(${entries.createdAt}, 'YYYY-MM-DD')`,
      categoryId: entries.categoryId,
      count: sql<number>`count(*)::int`,
    })
    .from(entries)
    .where(eq(entries.periodId, periodId))
    .groupBy(sql`to_char(${entries.createdAt}, 'YYYY-MM-DD')`, entries.categoryId);

  const byDate = new Map<string, DayBreakdownEntry>();
  for (const row of rows) {
    const category = catById.get(row.categoryId);
    if (!category) continue;
    const current = byDate.get(row.date) ?? {
      date: row.date,
      points: 0,
      bierCount: 0,
      cocktailCount: 0,
    };
    current.points += row.count * category.pointWeight;
    if (category.key === "bier") current.bierCount += row.count;
    if (category.key === "cocktail") current.cocktailCount += row.count;
    byDate.set(row.date, current);
  }

  return Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date));
}
