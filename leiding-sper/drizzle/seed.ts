import { db } from "../db/client";
import { accounts, categories, persons } from "../db/schema";
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
  { name: "Emma Willems", type: "leiding", isAdmin: false, pin: "6789" },
  { name: "Lars Mertens", type: "leiding", isAdmin: false, pin: "7890" },
  { name: "Nele Goossens", type: "leiding", isAdmin: false, pin: "8901" },
  { name: "Sander Janssens", type: "leiding", isAdmin: false, pin: "9012" },
  { name: "Lotte Maes", type: "leiding", isAdmin: false, pin: "0123" },
  { name: "Thomas De Smet", type: "leiding", isAdmin: false, pin: "1235" },
  { name: "Anke Vermeulen", type: "leiding", isAdmin: false, pin: "1236" },
  { name: "Wout Dubois", type: "leiding", isAdmin: false, pin: "1237" },
  { name: "Sofie Lambrechts", type: "leiding", isAdmin: false, pin: "1238" },
  { name: "Bram Hermans", type: "leiding", isAdmin: false, pin: "1239" },
  { name: "Julie Coppens", type: "leiding", isAdmin: false, pin: "1240" },
  { name: "Stijn De Backer", type: "leiding", isAdmin: false, pin: "1241" },
  { name: "Hanne Van Acker", type: "leiding", isAdmin: false, pin: "1242" },
  { name: "Pieter Verstraete", type: "extern", isAdmin: false, pin: "1243" },
  { name: "Charlotte Michiels", type: "extern", isAdmin: false, pin: "1244" },
];

const SPECIAL_PERSONS = ["Werkdag", "Vergadering", "Comité"];

async function main() {
  const existing = await db.select().from(persons).limit(1);
  if (existing.length > 0) {
    console.log("Persons table is not empty - skipping person/account seed.");
  } else {
    for (const name of SPECIAL_PERSONS) {
      await db.insert(persons).values({ name, type: "special" });
    }

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
    console.log(`Seeded ${SPECIAL_PERSONS.length} special persons and ${ROSTER.length} accounts.`);
  }

  await db
    .insert(categories)
    .values([
      {
        key: "bier",
        label: "Bier",
        streepjeWeight: 1,
        priceCents: 100,
        externExtraCents: 50,
      },
      {
        key: "sterke",
        label: "Sterke",
        streepjeWeight: 2,
        priceCents: 200,
        externExtraCents: 100,
      },
    ])
    .onConflictDoNothing({ target: categories.key });
  console.log("Categories ensured.");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
