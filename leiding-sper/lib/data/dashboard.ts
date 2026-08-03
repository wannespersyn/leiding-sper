import "server-only";
import { eq, isNull, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { categories, entries, favorites, persons } from "@/db/schema";

export type CategorySummary = {
  id: string;
  key: "bier" | "sterke";
  label: string;
  streepjeWeight: number;
  priceCents: number;
  externExtraCents: number;
};

export type PersonSummary = {
  id: string;
  name: string;
  type: "leiding" | "extern" | "special";
  isAdmin: boolean;
  bierCount: number;
  sterkeCount: number;
  totalStreepjes: number;
  amountCents: number | null;
  isFavorite: boolean;
};

export async function getCategories(): Promise<CategorySummary[]> {
  return db.select().from(categories).orderBy(categories.key);
}

export async function getDashboardData(
  accountId: string,
): Promise<{ people: PersonSummary[]; categories: CategorySummary[] }> {
  const cats = await getCategories();
  const catById = new Map(cats.map((c) => [c.id, c]));
  const catByKey = new Map(cats.map((c) => [c.key, c]));

  const allPersons = await db.select().from(persons).orderBy(persons.name);

  const openCounts = await db
    .select({
      personId: entries.personId,
      categoryId: entries.categoryId,
      count: sql<number>`count(*)::int`,
    })
    .from(entries)
    .where(isNull(entries.settlementId))
    .groupBy(entries.personId, entries.categoryId);

  const favRows = await db
    .select({ personId: favorites.personId })
    .from(favorites)
    .where(eq(favorites.accountId, accountId));
  const favSet = new Set(favRows.map((r) => r.personId));

  const countsByPerson = new Map<
    string,
    { bierCount: number; sterkeCount: number; totalStreepjes: number; amountCents: number }
  >();

  for (const row of openCounts) {
    const category = catById.get(row.categoryId);
    if (!category) continue;
    const current = countsByPerson.get(row.personId) ?? {
      bierCount: 0,
      sterkeCount: 0,
      totalStreepjes: 0,
      amountCents: 0,
    };
    if (category.key === "bier") current.bierCount += row.count;
    if (category.key === "sterke") current.sterkeCount += row.count;
    current.totalStreepjes += row.count * category.streepjeWeight;
    current.amountCents += row.count * category.priceCents;
    countsByPerson.set(row.personId, current);
  }

  const people: PersonSummary[] = allPersons.map((person) => {
    const counts = countsByPerson.get(person.id);
    let amountCents: number | null = null;
    if (person.type !== "special") {
      amountCents = counts?.amountCents ?? 0;
      if (person.type === "extern") {
        const bierExtra =
          (counts?.bierCount ?? 0) * (catByKey.get("bier")?.externExtraCents ?? 0);
        const sterkeExtra =
          (counts?.sterkeCount ?? 0) *
          (catByKey.get("sterke")?.externExtraCents ?? 0);
        amountCents += bierExtra + sterkeExtra;
      }
    }

    return {
      id: person.id,
      name: person.name,
      type: person.type,
      isAdmin: person.isAdmin,
      bierCount: counts?.bierCount ?? 0,
      sterkeCount: counts?.sterkeCount ?? 0,
      totalStreepjes: counts?.totalStreepjes ?? 0,
      amountCents,
      isFavorite: favSet.has(person.id),
    };
  });

  return { people, categories: cats };
}
