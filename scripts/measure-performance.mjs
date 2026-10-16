/** Local synthetic measurements; not a production Lighthouse score. */
import { chromium } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
const browser = await chromium.launch();
const results = [];
for (const mode of ["desktop", "mobile-throttled"]) {
  for (let run = 1; run <= 3; run++) {
    const context = await browser.newContext({
      viewport: { width: mode === "desktop" ? 1440 : 390, height: 900 },
      reducedMotion: "reduce",
    });
    const page = await context.newPage();
    const cdp = await context.newCDPSession(page);
    await cdp.send("Network.enable");
    await cdp.send("Network.setCacheDisabled", { cacheDisabled: true });
    if (mode !== "desktop") {
      await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
      await cdp.send("Network.emulateNetworkConditions", {
        offline: false,
        latency: 150,
        downloadThroughput: 200000,
        uploadThroughput: 93750,
      });
    }
    await page.addInitScript(() => {
      window.__measure = { lcp: 0, cls: 0 };
      new PerformanceObserver((list) => {
        for (const e of list.getEntries()) window.__measure.lcp = e.startTime;
      }).observe({ type: "largest-contentful-paint", buffered: true });
      new PerformanceObserver((list) => {
        for (const e of list.getEntries())
          if (!e.hadRecentInput) window.__measure.cls += e.value;
      }).observe({ type: "layout-shift", buffered: true });
    });
    await page.goto("http://localhost:3000/", { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);
    results.push({
      mode,
      run,
      ...(await page.evaluate(() => {
        const nav = performance.getEntriesByType("navigation")[0];
        return {
          ttfbMs: Math.round(nav.responseStart - nav.requestStart),
          fcpMs: Math.round(
            performance.getEntriesByName("first-contentful-paint")[0]
              ?.startTime || 0,
          ),
          lcpMs: Math.round(window.__measure.lcp),
          cls: window.__measure.cls,
          transferredBytes: performance
            .getEntriesByType("resource")
            .reduce((n, r) => n + r.transferSize, nav.transferSize),
        };
      })),
    });
    await context.close();
  }
}
await browser.close();
mkdirSync(".local", { recursive: true, mode: 0o700 });
writeFileSync(".local/performance.json", JSON.stringify(results, null, 2));
console.log(JSON.stringify(results, null, 2));
