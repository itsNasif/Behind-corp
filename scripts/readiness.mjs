// Operational probe from a trusted machine. Does not expose dependency status publicly.
const targets = [
  ["website", process.env.APP_ORIGIN && `${process.env.APP_ORIGIN}/api/health`],
  [
    "identity",
    process.env.OIDC_ISSUER &&
      `${process.env.OIDC_ISSUER}/.well-known/openid-configuration`,
  ],
];
for (const [name, url] of targets) {
  if (!url) throw new Error(`${name} URL missing`);
  const start = performance.now();
  const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
  console.log(
    JSON.stringify({
      dependency: name,
      ok: response.ok,
      latencyMs: Math.round(performance.now() - start),
    }),
  );
  if (!response.ok) process.exitCode = 1;
}
