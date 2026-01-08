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

export const societiesTable = pgTable("societies", {
  id: uuid("id").primaryKey().defaultRandom(),
  societyName: text("society_name").notNull(),
  title: text("title").notNull().unique(),
  startTime: timestamp("start_time", {
    withTimezone: true,
    mode: "date",
  }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
    .notNull()
    .defaultNow(),
});

export const usersRelations = relations(usersTable, ({ many }) => ({
  interests: many(userInterestsTable),
  messages: many(messagesTable),
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
