"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db/client";
import { accounts, persons } from "@/db/schema";
import { hashPin } from "@/lib/auth/pin";
import { PIN_LENGTH } from "@/lib/auth/constants";
import { createSession, requireAdmin } from "@/lib/auth/session";

async function createPersonWithAccount(
  name: string,
  role: "leiding" | "extern",
  pin: string,
  isAdmin: boolean,
) {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Naam is verplicht.");
  if (!new RegExp(`^\\d{${PIN_LENGTH}}$`).test(pin)) {
    throw new Error(`Pincode moet ${PIN_LENGTH} cijfers zijn.`);
  }

  const [person] = await db
    .insert(persons)
    .values({ name: trimmed, type: role, isAdmin })
    .returning();
  const { hash, salt } = hashPin(pin);
  const [account] = await db
    .insert(accounts)
    .values({ personId: person.id, pinHash: hash, pinSalt: salt })
    .returning();

  return { person, account };
}

export async function adminAddMember(
  name: string,
  role: "leiding" | "extern",
  pin: string,
): Promise<void> {
  await requireAdmin();
  await createPersonWithAccount(name, role, pin, false);
  revalidatePath("/admin");
  revalidatePath("/");
}

/** Public - this is the action the QR-code /join flow hits. No session
 * required to call it, but the resulting account is logged in immediately
 * afterward so the person never sees an intermediate unauthenticated state. */
export async function selfRegister(
  name: string,
  role: "leiding" | "extern",
  pin: string,
): Promise<{ error: string } | never> {
  if (role !== "leiding" && role !== "extern") {
    return { error: "Ongeldige rol." };
  }
  let account;
  try {
    ({ account } = await createPersonWithAccount(name, role, pin, false));
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Registratie mislukt." };
  }
  await createSession(account.id);
  redirect("/");
}

export async function removeMember(personId: string): Promise<void> {
  await requireAdmin();
  await db.delete(persons).where(eq(persons.id, personId));
  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath("/overzicht");
}

export async function toggleRole(personId: string): Promise<void> {
  await requireAdmin();
  const [person] = await db.select().from(persons).where(eq(persons.id, personId)).limit(1);
  if (!person || person.type === "scouts") return;

  const newType = person.type === "leiding" ? "extern" : "leiding";
  await db.update(persons).set({ type: newType }).where(eq(persons.id, personId));

  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath("/overzicht");
  revalidatePath(`/person/${personId}`);
}
