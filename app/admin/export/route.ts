import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/session";
import { getDashboardData } from "@/lib/data/dashboard";
import { toCsv } from "@/lib/csv";

const TYPE_LABEL: Record<string, string> = {
  leiding: "Leiding",
  extern: "Extern",
  special: "Groep",
};

export async function GET() {
  try {
    const session = await requireAdmin();
    const { people } = await getDashboardData(session.accountId);

    const rows: (string | number)[][] = [
      ["Naam", "Type", "Bier", "Sterke", "Streepjes", "Bedrag (EUR)"],
      ...people.map((p) => [
        p.name,
        TYPE_LABEL[p.type],
        p.bierCount,
        p.sterkeCount,
        p.totalStreepjes,
        p.amountCents === null ? "" : (p.amountCents / 100).toFixed(2),
      ]),
    ];

    const csv = toCsv(rows);
    const date = new Date().toISOString().slice(0, 10);

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="streepjes-${date}.csv"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "Niet toegestaan." }, { status: 403 });
  }
}
