import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { accounts, persons } from "@/db/schema";

export type LoginRosterEntry = {
  personId: string;
  accountId: string;
  name: string;
};

export async function getLoginRoster(): Promise<LoginRosterEntry[]> {
  const rows = await db
    .select({
      personId: persons.id,
      accountId: accounts.id,
      name: persons.name,
    })
    .from(accounts)
    .innerJoin(persons, eq(accounts.personId, persons.id))
    .orderBy(persons.name);

  return rows;
}
