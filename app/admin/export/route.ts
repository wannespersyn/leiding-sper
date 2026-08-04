import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/session";
import { getDashboardData } from "@/lib/data/dashboard";
import { TYPE_LABEL } from "@/lib/personType";
import { toCsv } from "@/lib/csv";

export async function GET() {
  try {
    const session = await requireAdmin();
    const { people, period } = await getDashboardData(session.accountId);

    const rows: (string | number)[][] = [
      ["Naam", "Type", "Bier", "Cocktail", "Punten", "Bedrag (EUR)"],
      ...people.map((p) => [
        p.name,
        TYPE_LABEL[p.type],
        p.bierCount,
        p.cocktailCount,
        p.totalPoints,
        p.amountCents === null ? "" : (p.amountCents / 100).toFixed(2),
      ]),
    ];

    const csv = toCsv(rows);
    const safeName = period.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase();

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="staftracker-${safeName}.csv"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "Niet toegestaan." }, { status: 403 });
  }
}
