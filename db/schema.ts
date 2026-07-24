import { relations, sql } from "drizzle-orm";
import {
  check,
  customType,
  index,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

const citext = customType<{ data: string }>({
  dataType() {
    return "citext";
  },
});

export const beerActionType = pgEnum("beer_action_type", ["BEER_ADDED"]);
export const userRole = pgEnum("user_role", ["USER", "ADMIN"]);
export const eventMemberRole = pgEnum("event_member_role", ["CREATOR", "MEMBER"]);

export const beerTypes = pgTable(
  "beer_types",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: citext("name").notNull(),
    photoDataUrl: text("photo_data_url").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique("beer_types_name_unique").on(table.name),
    check("beer_types_name_not_blank", sql`length(btrim(${table.name}::text)) > 0`),
    check(
      "beer_types_photo_size",
      sql`length(${table.photoDataUrl}) <= 1400000`,
    ),
  ],
);

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    username: citext("username").notNull(),
    email: citext("email").notNull(),
    passwordHash: varchar("password_hash", { length: 60 }).notNull(),
    role: userRole("role").default("USER").notNull(),
    beerCount: integer("beer_count").default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique("users_username_unique").on(table.username),
    unique("users_email_unique").on(table.email),
    check("users_username_not_blank", sql`length(btrim(${table.username}::text)) > 0`),
    check("users_beer_count_non_negative", sql`${table.beerCount} >= 0`),
    index("users_ranking_idx").on(table.beerCount.desc(), table.username.asc()),
  ],
);

export const events = pgTable(
  "events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    creatorId: uuid("creator_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    name: varchar("name", { length: 80 }).notNull(),
    inviteCode: varchar("invite_code", { length: 10 }).notNull(),
    startsAt: timestamp("starts_at", { withTimezone: true, mode: "date" }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true, mode: "date" }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique("events_invite_code_unique").on(table.inviteCode),
    check("events_name_not_blank", sql`length(btrim(${table.name})) > 0`),
    check("events_valid_duration", sql`${table.endsAt} > ${table.startsAt}`),
    index("events_creator_id_idx").on(table.creatorId),
    index("events_starts_at_idx").on(table.startsAt.desc()),
  ],
);

export const eventMembers = pgTable(
  "event_members",
  {
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    role: eventMemberRole("role").default("MEMBER").notNull(),
    joinedAt: timestamp("joined_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    primaryKey({ name: "event_members_pk", columns: [table.eventId, table.userId] }),
    index("event_members_user_id_idx").on(table.userId),
  ],
);

export const beerLogs = pgTable(
  "beer_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    beerTypeId: uuid("beer_type_id").references(() => beerTypes.id, {
      onDelete: "set null",
    }),
    eventId: uuid("event_id").references(() => events.id, {
      onDelete: "set null",
    }),
    actionType: beerActionType("action_type").notNull(),
    quantity: integer("quantity").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    check("beer_logs_quantity_positive", sql`${table.quantity} > 0`),
    index("beer_logs_created_at_idx").on(table.createdAt.desc()),
    index("beer_logs_user_id_idx").on(table.userId),
    index("beer_logs_beer_type_id_idx").on(table.beerTypeId),
    index("beer_logs_event_id_idx").on(table.eventId),
  ],
);

export const usersRelations = relations(users, ({ many }) => ({
  beerLogs: many(beerLogs),
  createdEvents: many(events),
  eventMemberships: many(eventMembers),
}));

export const beerLogsRelations = relations(beerLogs, ({ one }) => ({
  user: one(users, {
    fields: [beerLogs.userId],
    references: [users.id],
  }),
  beerType: one(beerTypes, {
    fields: [beerLogs.beerTypeId],
    references: [beerTypes.id],
  }),
  event: one(events, {
    fields: [beerLogs.eventId],
    references: [events.id],
  }),
}));

export const beerTypesRelations = relations(beerTypes, ({ many }) => ({
  beerLogs: many(beerLogs),
}));

export const eventsRelations = relations(events, ({ one, many }) => ({
  creator: one(users, {
    fields: [events.creatorId],
    references: [users.id],
  }),
  members: many(eventMembers),
  beerLogs: many(beerLogs),
}));

export const eventMembersRelations = relations(eventMembers, ({ one }) => ({
  event: one(events, {
    fields: [eventMembers.eventId],
    references: [events.id],
  }),
  user: one(users, {
    fields: [eventMembers.userId],
    references: [users.id],
  }),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type BeerLog = typeof beerLogs.$inferSelect;
export type BeerType = typeof beerTypes.$inferSelect;
export type Event = typeof events.$inferSelect;
