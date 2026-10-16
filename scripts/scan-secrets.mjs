import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { parse } from "dotenv";
const files = execFileSync(
  "git",
  ["ls-files", "--cached", "--others", "--exclude-standard"],
  { encoding: "utf8" },
)
  .split("\n")
  .filter(Boolean);
const env = parse(readFileSync(".env.local"));
const secrets = Object.entries(env)
  .filter(
    ([k, v]) =>
      /PASSWORD|SECRET|TOKEN|SALT/.test(k) &&
      v.length >= 20 &&
      !k.includes("TURNSTILE"),
  )
  .map(([, v]) => v);
const scan = (path) => {
  const text = readFileSync(path).toString();
  if (secrets.some((value) => text.includes(value)))
    throw new Error(`Generated secret found in ${path}`);
  if (/-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----/.test(text))
    throw new Error(`Private key found in ${path}`);
};
files.forEach(scan);
function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const path = `${dir}/${entry}`;
    if (statSync(path).isDirectory()) walk(path);
    else scan(path);
  }
}
walk(".next/static");
console.log(
  `Scanned ${files.length} source files and browser bundles: no generated environment secrets or private keys found.`,
);
