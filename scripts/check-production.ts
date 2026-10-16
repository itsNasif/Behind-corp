import { validateProduction } from "../lib/env";
if (process.env.APP_ENV !== "production" && process.env.APP_ENV !== "staging")
  throw new Error("Set APP_ENV to production or staging");
validateProduction();
console.log(
  "Production configuration validation passed (connectivity not verified).",
);
