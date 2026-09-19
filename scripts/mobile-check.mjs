import { chromium } from "@playwright/test";
import { readFile, mkdir } from "node:fs/promises";
import assert from "node:assert/strict";
const browser = await chromium.launch();
await mkdir("artifacts/layout", { recursive: true });
try {
  for (const width of [320, 390, 768, 1280]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.route("**/api/generate-step", async (route) => {
      const data = JSON.parse(
        await readFile("tests/fixtures/fill3.json", "utf8"),
      );
      const req = route.request().postDataJSON();
      if (req.resolution === 32) {
        data.groove.steps = data.groove.steps.flatMap((s) => [
          s,
          Object.fromEntries(Object.keys(s).map((k) => [k, 0])),
        ]);
        data.groove.resolution = 32;
      }
      await route.fulfill({ json: data });
    });
    await page.goto(process.env.UI_URL || "http://127.0.0.1:5173/");
    assert.equal(await page.title(), "Jevbox — Make a beat with Jev");
    await page.getByLabel("Note subdivision").selectOption("32");
    await page
      .getByRole("button", { name: "Make & play", exact: true })
      .click();
    await page.getByRole("button", { name: "Stop", exact: true }).click();
    await page.getByRole("button", { name: "Bar 4", exact: true }).click();
    if (width < 900) {
      await page.getByRole("button", { name: "Beat 4 &", exact: true }).click();
      const last = page.getByRole("button", { name: /Kick, step 128:/ });
      const box = await last.boundingBox();
      assert.ok(box.width >= 44 && box.height >= 44, JSON.stringify(box));
      await last.click();
      assert.match(await last.getAttribute("aria-label"), /velocity 32/);
    }
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
      false,
    );
    assert.ok(
      !/TypeSafe|BEATBOX|Audio to MIDI/.test(
        await page.locator("body").innerText(),
      ),
    );
    await page.screenshot({
      path: `artifacts/layout/${width}.png`,
      fullPage: true,
    });
    assert.deepEqual(errors, []);
    await page.close();
  }
  console.log(
    "320, 390, 768, 1280px: no page overflow; mobile 1/32 final note editable with ≥44px touch targets; Jev branding only.",
  );
} finally {
  await browser.close();
}
