import "server-only";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { required } from "./env";
let database: ReturnType<typeof drizzle>;
export function db() {
  database ??= drizzle(
    postgres(required("DATABASE_URL"), {
      max: 3,
      prepare: false,
      idle_timeout: 20,
      connect_timeout: 5,
      ssl:
        process.env.APP_ENV === "local" ? false : { rejectUnauthorized: true },
    }),
  );
  return database;
}
