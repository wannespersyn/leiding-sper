import "server-only";
import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/db/client";
import {
  categories,
  entries,
  favorites,
  persons,
  settlementPrices,
  settlements,
} from "@/db/schema";
import { getCategories, type CategorySummary, type PersonSummary } from "./dashboard";

export type SettlementHistoryEntry = {
  settlementId: string;
  settledAt: Date;
  totalStreepjes: number;
  amountCents: number;
};

export type PersonDetail = {
  person: PersonSummary;
  settlementHistory: SettlementHistoryEntry[];
};

type PersonRow = typeof persons.$inferSelect;

function computeOpenTotals(person: PersonRow, cats: CategorySummary[], openCounts: { categoryId: string; count: number }[]) {
  let bierCount = 0;
  let sterkeCount = 0;
  let totalStreepjes = 0;
  let amountCents: number | null = person.type === "special" ? null : 0;

  for (const row of openCounts) {
    const cat = cats.find((c) => c.id === row.categoryId);
    if (!cat) continue;
    if (cat.key === "bier") bierCount += row.count;
    if (cat.key === "sterke") sterkeCount += row.count;
    totalStreepjes += row.count * cat.streepjeWeight;
    if (amountCents !== null) {
      const extra = person.type === "extern" ? cat.externExtraCents : 0;
      amountCents += row.count * (cat.priceCents + extra);
    }
  }

  return { bierCount, sterkeCount, totalStreepjes, amountCents };
}

type SettlementRow = {
  settlementId: string;
  settledAt: Date;
  streepjeWeight: number;
  priceCents: number;
  externExtraCents: number;
  count: number;
};

function computeSettlementHistory(
  rows: SettlementRow[],
  isExtern: boolean,
): SettlementHistoryEntry[] {
  const bySettlement = new Map<string, SettlementHistoryEntry>();

  for (const row of rows) {
    const current = bySettlement.get(row.settlementId) ?? {
      settlementId: row.settlementId,
      settledAt: row.settledAt,
      totalStreepjes: 0,
      amountCents: 0,
    };
    const extra = isExtern ? row.externExtraCents : 0;
    current.totalStreepjes += row.count * row.streepjeWeight;
    current.amountCents += row.count * (row.priceCents + extra);
    bySettlement.set(row.settlementId, current);
  }

  return Array.from(bySettlement.values());
}

async function fetchOpenCounts(personId: string) {
  return db
    .select({
      categoryId: entries.categoryId,
      count: sql<number>`count(*)::int`,
    })
    .from(entries)
    .where(and(eq(entries.personId, personId), isNull(entries.settlementId)))
    .groupBy(entries.categoryId);
}

async function fetchSettlementRows(personId: string) {
  return db
    .select({
      settlementId: settlements.id,
      settledAt: settlements.createdAt,
      streepjeWeight: categories.streepjeWeight,
      priceCents: settlementPrices.priceCents,
      externExtraCents: settlementPrices.externExtraCents,
      count: sql<number>`count(*)::int`,
    })
    .from(entries)
    .innerJoin(settlements, eq(entries.settlementId, settlements.id))
    .innerJoin(
      settlementPrices,
      and(
        eq(settlementPrices.settlementId, settlements.id),
        eq(settlementPrices.categoryId, entries.categoryId),
      ),
    )
    .innerJoin(categories, eq(categories.id, entries.categoryId))
    .where(eq(entries.personId, personId))
    .groupBy(
      settlements.id,
      settlements.createdAt,
      categories.streepjeWeight,
      settlementPrices.priceCents,
      settlementPrices.externExtraCents,
    )
    .orderBy(desc(settlements.createdAt));
}

export async function getPersonDetail(
  personId: string,
  viewerAccountId: string,
): Promise<PersonDetail | null> {
  const [person] = await db
    .select()
    .from(persons)
    .where(eq(persons.id, personId))
    .limit(1);
  if (!person) return null;

  const cats = await getCategories();
  const openCounts = await fetchOpenCounts(personId);
  const openTotals = computeOpenTotals(person, cats, openCounts);

  const [favorite] = await db
    .select()
    .from(favorites)
    .where(
      and(
        eq(favorites.accountId, viewerAccountId),
        eq(favorites.personId, personId),
      ),
    )
    .limit(1);

  const settlementRows = await fetchSettlementRows(personId);
  const settlementHistory = computeSettlementHistory(
    settlementRows,
    person.type === "extern",
  );

  return {
    person: {
      id: person.id,
      name: person.name,
      type: person.type,
      isAdmin: person.isAdmin,
      ...openTotals,
      isFavorite: !!favorite,
    },
    settlementHistory,
  };
}
