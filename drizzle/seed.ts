import { db } from "../db/client";
import { accounts, categories, periods, persons } from "../db/schema";
import { hashPin } from "../lib/auth/pin";

// Edit this roster with the real group before running the seed script.
// `pin` is only used once, at seed time, to create the initial login PIN -
// people can be given a new one later via the database if needed.
const ROSTER: {
  name: string;
  type: "leiding" | "extern";
  isAdmin: boolean;
  pin: string;
}[] = [
  { name: "Wannes Persyn", type: "leiding", isAdmin: true, pin: "1234" },
  { name: "Fien Van Damme", type: "leiding", isAdmin: true, pin: "2345" },
  { name: "Arne Peeters", type: "leiding", isAdmin: false, pin: "3456" },
  { name: "Marie Claes", type: "leiding", isAdmin: false, pin: "4567" },
  { name: "Jonas Wouters", type: "leiding", isAdmin: false, pin: "5678" },
  { name: "Pieter Verstraete", type: "extern", isAdmin: false, pin: "6789" },
];

async function main() {
  const existing = await db.select().from(persons).limit(1);
  if (existing.length > 0) {
    console.log("Persons table is not empty - skipping person/account seed.");
  } else {
    await db.insert(persons).values({ name: "Scouts Rotselaar", type: "scouts" });

    for (const entry of ROSTER) {
      const [person] = await db
        .insert(persons)
        .values({ name: entry.name, type: entry.type, isAdmin: entry.isAdmin })
        .returning();
      const { hash, salt } = hashPin(entry.pin);
      await db.insert(accounts).values({
        personId: person.id,
        pinHash: hash,
        pinSalt: salt,
      });
    }
    console.log(`Seeded Scouts Rotselaar and ${ROSTER.length} accounts.`);
  }

  await db
    .insert(categories)
    .values([
      {
        key: "bier",
        label: "Bier",
        pointWeight: 1,
        priceLeidingCents: 50,
        priceExternCents: 80,
      },
      {
        key: "cocktail",
        label: "Cocktail",
        pointWeight: 2,
        priceLeidingCents: 200,
        priceExternCents: 300,
      },
    ])
    .onConflictDoNothing({ target: categories.key });
  console.log("Categories ensured.");

  const existingPeriod = await db.select().from(periods).limit(1);
  if (existingPeriod.length === 0) {
    await db.insert(periods).values({ name: "Zomer 2026" });
    console.log("Opened initial period 'Zomer 2026'.");
  } else {
    console.log("A period already exists - skipping.");
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
