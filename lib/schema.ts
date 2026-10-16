import {
  pgSchema,
  uuid,
  text,
  timestamp,
  boolean,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
const privateSchema = pgSchema("behind_private");
export const profiles = privateSchema.table(
  "profiles",
  {
    id: uuid().primaryKey().defaultRandom(),
    issuer: text().notNull(),
    subject: text().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [uniqueIndex("identity_unique").on(t.issuer, t.subject)],
);
export const preferences = privateSchema.table("preferences", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => profiles.id, { onDelete: "cascade" }),
  reducedMotion: boolean("reduced_motion").notNull().default(false),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
export const inquiries = privateSchema.table(
  "inquiries",
  {
    id: uuid().primaryKey().defaultRandom(),
    requestId: uuid("request_id").notNull().unique(),
    payloadHash: text("payload_hash").notNull(),
    userId: uuid("user_id").references(() => profiles.id, {
      onDelete: "set null",
    }),
    name: text().notNull(),
    email: text().notNull(),
    topic: text().notNull(),
    message: text().notNull(),
    status: text().notNull().default("new"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("inquiries_created").on(t.createdAt),
    index("inquiries_user").on(t.userId),
  ],
);
export const auditRecords = privateSchema.table(
  "audit_records",
  {
    id: uuid().primaryKey().defaultRandom(),
    actorId: uuid("actor_id").references(() => profiles.id, {
      onDelete: "set null",
    }),
    event: text().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("audit_created").on(t.createdAt)],
);
