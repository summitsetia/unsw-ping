import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  pgEnum,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const messageRoles = pgEnum("message_roles", [
  "user",
  "system",
  "assistant",
]);

export const usersTable = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().default(""),
  phoneNumber: text("phone_number").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
    .notNull()
    .defaultNow(),
});

export const userInterestsTable = pgTable(
  "user_interests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    interest: text("interest").notNull(),
    notes: text("notes").notNull().default(""),
    priority: integer("priority").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("user_interests_user_id_interest_unique").on(
      table.userId,
      table.interest
    ),
  ]
);

export const messagesTable = pgTable("messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  role: messageRoles("role").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
    .notNull()
    .defaultNow(),
});

export const eventsTable = pgTable("events", {
  id: uuid("id").primaryKey().defaultRandom(),
  societyName: text("society_name").notNull(),
  title: text("title").notNull().unique(),
  startTime: timestamp("start_time", {
    withTimezone: true,
    mode: "date",
  }).notNull(),
  location: text("location").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
    .notNull()
    .defaultNow(),
});

export const calendarConnectRequestsTable = pgTable(
  "calendar_connect_requests",
  {
    id: text("id").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),

    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  }
);

export const googleCalendarTokensTable = pgTable("google_calendar_tokens", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => usersTable.id, { onDelete: "cascade" }),

  refreshToken: text("refresh_token"),
  expiresAt: timestamp("expires_at", {
    withTimezone: true,
    mode: "date",
  }),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
    .notNull()
    .defaultNow(),
});

export const userSocietiesTable = pgTable("user_societies", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  society_name: text("society_name").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
    .notNull()
    .defaultNow(),
});

export const calendarConnectRequestsRelations = relations(
  calendarConnectRequestsTable,
  ({ one }) => ({
    user: one(usersTable, {
      fields: [calendarConnectRequestsTable.userId],
      references: [usersTable.id],
    }),
  })
);

export const googleCalendarTokensRelations = relations(
  googleCalendarTokensTable,
  ({ one }) => ({
    user: one(usersTable, {
      fields: [googleCalendarTokensTable.userId],
      references: [usersTable.id],
    }),
  })
);

export const usersRelations = relations(usersTable, ({ many }) => ({
  interests: many(userInterestsTable),
  messages: many(messagesTable),
  societies: many(userSocietiesTable),
}));

export const userInterestsRelations = relations(
  userInterestsTable,
  ({ one }) => ({
    user: one(usersTable, {
      fields: [userInterestsTable.userId],
      references: [usersTable.id],
    }),
  })
);

export const messagesRelations = relations(messagesTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [messagesTable.userId],
    references: [usersTable.id],
  }),
}));

export const userSocietiesRelations = relations(
  userSocietiesTable,
  ({ one }) => ({
    user: one(usersTable, {
      fields: [userSocietiesTable.userId],
      references: [usersTable.id],
    }),
  })
);
