import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  pgEnum,
  unique,
} from "drizzle-orm/pg-core";

export const personTypeEnum = pgEnum("person_type", [
  "leiding",
  "extern",
  "scouts",
]);

export const categoryKeyEnum = pgEnum("category_key", ["bier", "cocktail"]);

export const persons = pgTable("persons", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  type: personTypeEnum("type").notNull(),
  isAdmin: boolean("is_admin").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const accounts = pgTable("accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  personId: uuid("person_id")
    .notNull()
    .unique()
    .references(() => persons.id, { onDelete: "cascade" }),
  pinHash: text("pin_hash").notNull(),
  pinSalt: text("pin_salt").notNull(),
  failedAttempts: integer("failed_attempts").notNull().default(0),
  lockedUntil: timestamp("locked_until", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  accountId: uuid("account_id")
    .notNull()
    .references(() => accounts.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const categories = pgTable("categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  key: categoryKeyEnum("key").notNull().unique(),
  label: text("label").notNull(),
  pointWeight: integer("point_weight").notNull(),
  priceLeidingCents: integer("price_leiding_cents").notNull().default(0),
  priceExternCents: integer("price_extern_cents").notNull().default(0),
});

export const periods = pgTable("periods", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  startedAt: timestamp("started_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  closedAt: timestamp("closed_at", { withTimezone: true }),
});

export const periodCategoryPrices = pgTable(
  "period_category_prices",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    periodId: uuid("period_id")
      .notNull()
      .references(() => periods.id, { onDelete: "cascade" }),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id),
    priceLeidingCents: integer("price_leiding_cents").notNull(),
    priceExternCents: integer("price_extern_cents").notNull(),
  },
  (table) => [unique().on(table.periodId, table.categoryId)],
);

export const entries = pgTable("entries", {
  id: uuid("id").primaryKey().defaultRandom(),
  personId: uuid("person_id")
    .notNull()
    .references(() => persons.id, { onDelete: "cascade" }),
  categoryId: uuid("category_id")
    .notNull()
    .references(() => categories.id),
  periodId: uuid("period_id")
    .notNull()
    .references(() => periods.id, { onDelete: "cascade" }),
  // Nullable + set-null on delete: removing the adder's account (e.g. an
  // admin removes that member later) must not block deleting entries this
  // person logged for *other* people - it just loses the attribution.
  addedByAccountId: uuid("added_by_account_id").references(() => accounts.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const payments = pgTable(
  "payments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    personId: uuid("person_id")
      .notNull()
      .references(() => persons.id, { onDelete: "cascade" }),
    periodId: uuid("period_id")
      .notNull()
      .references(() => periods.id, { onDelete: "cascade" }),
    markedPaidAt: timestamp("marked_paid_at", { withTimezone: true }),
    confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
    confirmedByAccountId: uuid("confirmed_by_account_id").references(
      () => accounts.id,
      { onDelete: "set null" },
    ),
  },
  (table) => [unique().on(table.personId, table.periodId)],
);

export const favorites = pgTable(
  "favorites",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    accountId: uuid("account_id")
      .notNull()
      .references(() => accounts.id, { onDelete: "cascade" }),
    personId: uuid("person_id")
      .notNull()
      .references(() => persons.id, { onDelete: "cascade" }),
  },
  (table) => [unique().on(table.accountId, table.personId)],
);
