import "server-only";
import { and, desc, eq, gte, sql } from "drizzle-orm";
import { db } from "@/db/client";
import {
  entries,
  favorites,
  payments,
  periodCategoryPrices,
  periods,
  persons,
} from "@/db/schema";
import { computeBadges, type BadgeDef } from "@/lib/badges";
import { getCategories, getCurrentPeriod, type PersonSummary } from "./dashboard";

const CHART_DAYS = 14;

export type PaymentState = "none" | "pending" | "confirmed";

export type PeriodPaymentEntry = {
  periodId: string;
  periodName: string;
  isCurrent: boolean;
  closedAt: Date | null;
  totalPoints: number;
  amountCents: number | null;
  status: PaymentState;
};

export type TimelineEntry = {
  id: string;
  categoryKey: "bier" | "cocktail";
  label: string;
  createdAt: Date;
  deletable: boolean;
};

export type ChartPoint = { date: string; points: number };

export type PersonDetail = {
  person: PersonSummary;
  beerPct: number;
  cocktailPct: number;
  presentDays: number;
  chart: ChartPoint[];
  badges: BadgeDef[];
  payments: PeriodPaymentEntry[];
  timeline: TimelineEntry[];
};

export async function getPersonDetail(
  personId: string,
  viewer: { accountId: string; isAdmin: boolean },
): Promise<PersonDetail | null> {
  const [personRow] = await db
    .select()
    .from(persons)
    .where(eq(persons.id, personId))
    .limit(1);
  if (!personRow) return null;

  const cats = await getCategories();
  const catById = new Map(cats.map((c) => [c.id, c]));
  const currentPeriod = await getCurrentPeriod();

  const [favRow] = await db
    .select()
    .from(favorites)
    .where(and(eq(favorites.accountId, viewer.accountId), eq(favorites.personId, personId)))
    .limit(1);

  // Current-period counts.
  const currentCounts = await db
    .select({ categoryId: entries.categoryId, count: sql<number>`count(*)::int` })
    .from(entries)
    .where(and(eq(entries.personId, personId), eq(entries.periodId, currentPeriod.id)))
    .groupBy(entries.categoryId);

  let bierCount = 0;
  let cocktailCount = 0;
  let totalPoints = 0;
  let currentAmountCents: number | null = personRow.type === "scouts" ? null : 0;
  for (const row of currentCounts) {
    const cat = catById.get(row.categoryId);
    if (!cat) continue;
    if (cat.key === "bier") bierCount += row.count;
    if (cat.key === "cocktail") cocktailCount += row.count;
    totalPoints += row.count * cat.pointWeight;
    if (currentAmountCents !== null) {
      const price =
        personRow.type === "extern" ? cat.priceExternCents : cat.priceLeidingCents;
      currentAmountCents += row.count * price;
    }
  }

  const totalDrinks = bierCount + cocktailCount;
  const beerPct = totalDrinks > 0 ? Math.round((bierCount / totalDrinks) * 100) : 50;

  const person: PersonSummary = {
    id: personRow.id,
    name: personRow.name,
    type: personRow.type,
    isAdmin: personRow.isAdmin,
    bierCount,
    cocktailCount,
    totalPoints,
    amountCents: currentAmountCents,
    isFavorite: !!favRow,
  };

  // Lifetime stats for badges (all periods).
  const lifetimeCounts = await db
    .select({ categoryId: entries.categoryId, count: sql<number>`count(*)::int` })
    .from(entries)
    .where(eq(entries.personId, personId))
    .groupBy(entries.categoryId);
  let lifetimeBeers = 0;
  let lifetimeCocktails = 0;
  for (const row of lifetimeCounts) {
    const cat = catById.get(row.categoryId);
    if (!cat) continue;
    if (cat.key === "bier") lifetimeBeers += row.count;
    if (cat.key === "cocktail") lifetimeCocktails += row.count;
  }
  const [presentDaysRow] = await db
    .select({ count: sql<number>`count(distinct date(${entries.createdAt}))::int` })
    .from(entries)
    .where(eq(entries.personId, personId));
  const presentDays = presentDaysRow?.count ?? 0;

  const badges = computeBadges({
    beers: lifetimeBeers,
    cocktails: lifetimeCocktails,
    presentDays,
  });

  // 14-day chart.
  const windowStart = new Date();
  windowStart.setHours(0, 0, 0, 0);
  windowStart.setDate(windowStart.getDate() - (CHART_DAYS - 1));
  const chartRows = await db
    .select({
      date: sql<string>`to_char(${entries.createdAt}, 'YYYY-MM-DD')`,
      categoryId: entries.categoryId,
      count: sql<number>`count(*)::int`,
    })
    .from(entries)
    .where(and(eq(entries.personId, personId), gte(entries.createdAt, windowStart)))
    .groupBy(sql`to_char(${entries.createdAt}, 'YYYY-MM-DD')`, entries.categoryId);
  const pointsByDate = new Map<string, number>();
  for (const row of chartRows) {
    const cat = catById.get(row.categoryId);
    if (!cat) continue;
    pointsByDate.set(row.date, (pointsByDate.get(row.date) ?? 0) + row.count * cat.pointWeight);
  }
  const chart: ChartPoint[] = [];
  for (let i = CHART_DAYS - 1; i >= 0; i--) {
    const d = new Date(windowStart);
    d.setDate(d.getDate() + (CHART_DAYS - 1 - i));
    const key = d.toISOString().slice(0, 10);
    chart.push({ date: key, points: pointsByDate.get(key) ?? 0 });
  }

  // Payments per period.
  const allPeriods = await db.select().from(periods).orderBy(desc(periods.startedAt));
  const paymentRows = await db.select().from(payments).where(eq(payments.personId, personId));
  const paymentByPeriod = new Map(paymentRows.map((r) => [r.periodId, r]));

  const periodPayments: PeriodPaymentEntry[] = [];
  for (const p of allPeriods) {
    const isCurrent = p.id === currentPeriod.id;
    let periodTotalPoints = 0;
    let periodAmountCents: number | null = personRow.type === "scouts" ? null : 0;

    if (isCurrent) {
      periodTotalPoints = totalPoints;
      periodAmountCents = currentAmountCents;
    } else {
      const rows = await db
        .select({ categoryId: entries.categoryId, count: sql<number>`count(*)::int` })
        .from(entries)
        .where(and(eq(entries.personId, personId), eq(entries.periodId, p.id)))
        .groupBy(entries.categoryId);
      const priceRows = await db
        .select()
        .from(periodCategoryPrices)
        .where(eq(periodCategoryPrices.periodId, p.id));
      const priceByCategory = new Map(priceRows.map((r) => [r.categoryId, r]));
      for (const row of rows) {
        const cat = catById.get(row.categoryId);
        if (!cat) continue;
        periodTotalPoints += row.count * cat.pointWeight;
        if (periodAmountCents !== null) {
          const price = priceByCategory.get(row.categoryId);
          const cents = price
            ? personRow.type === "extern"
              ? price.priceExternCents
              : price.priceLeidingCents
            : 0;
          periodAmountCents += row.count * cents;
        }
      }
    }

    if (!isCurrent && periodTotalPoints === 0) continue;

    const paymentRow = paymentByPeriod.get(p.id);
    const status: PaymentState = paymentRow?.confirmedAt
      ? "confirmed"
      : paymentRow?.markedPaidAt
        ? "pending"
        : "none";

    periodPayments.push({
      periodId: p.id,
      periodName: p.name,
      isCurrent,
      closedAt: p.closedAt,
      totalPoints: periodTotalPoints,
      amountCents: periodAmountCents,
      status,
    });
  }

  // Timeline.
  const timelineRows = await db
    .select({
      id: entries.id,
      categoryId: entries.categoryId,
      periodId: entries.periodId,
      addedByAccountId: entries.addedByAccountId,
      createdAt: entries.createdAt,
    })
    .from(entries)
    .where(eq(entries.personId, personId))
    .orderBy(desc(entries.createdAt))
    .limit(30);

  const timeline: TimelineEntry[] = timelineRows.map((row) => {
    const cat = catById.get(row.categoryId);
    const inCurrentPeriod = row.periodId === currentPeriod.id;
    const deletable =
      inCurrentPeriod && (row.addedByAccountId === viewer.accountId || viewer.isAdmin);
    return {
      id: row.id,
      categoryKey: cat?.key ?? "bier",
      label: cat?.label ?? "?",
      createdAt: row.createdAt,
      deletable,
    };
  });

  return {
    person,
    beerPct,
    cocktailPct: 100 - beerPct,
    presentDays,
    chart,
    badges,
    payments: periodPayments,
    timeline,
  };
}
