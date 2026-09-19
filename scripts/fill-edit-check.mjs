import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
const browser = await chromium.launch();
try {
  const p = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errors = [];
  p.on("pageerror", (e) => errors.push(e.message));
  await p.goto(process.env.UI_URL || "https://jevbox.grahammiles.me/");
  await p
    .getByRole("textbox", { name: "Your groove" })
    .fill("Straight rock groove, no fills.");
  let response = p.waitForResponse((r) =>
    r.url().endsWith("/api/generate-step"),
  );
  await p.getByRole("button", { name: "Make & play", exact: true }).click();
  const original = (await (await response).json()).groove;
  await p.getByRole("button", { name: "Stop", exact: true }).click();
  await p
    .getByRole("textbox", { name: "Amend your beat" })
    .fill("add tom fills on bar 2");
  response = p.waitForResponse((r) => r.url().endsWith("/api/generate-step"));
  await p.getByRole("button", { name: "Apply edit", exact: true }).click();
  const result = await (await response).json();
  assert.ok(result.edits.length > 0);
  assert.ok(result.edits.every((e) => e.step >= 16 && e.step < 32));
  assert.deepEqual(
    result.groove.steps.slice(0, 16),
    original.steps.slice(0, 16),
  );
  assert.deepEqual(result.groove.steps.slice(32), original.steps.slice(32));
  assert.equal(result.groove.arrangements[1].fill, "tom_run");
  await p.getByRole("button", { name: "Bar 2", exact: true }).click();
  await p.getByRole("button", { name: "Beat 4", exact: true }).click();
  assert.match(
    await p
      .getByRole("button", { name: /High tom, step 29:/ })
      .getAttribute("aria-label"),
    /velocity 104/,
  );
  await p.getByRole("button", { name: "Play loop", exact: true }).click();
  await p.getByRole("button", { name: "Stop", exact: true }).click();
  await p.getByRole("button", { name: "Undo edit", exact: true }).click();
  assert.match(
    await p
      .getByRole("button", { name: /High tom, step 29:/ })
      .getAttribute("aria-label"),
    /rest/,
  );
  assert.deepEqual(errors, []);
  console.log(
    "Live mobile: exact fill amendment changes only bar 2; preview and Undo pass.",
  );
} finally {
  await browser.close();
}
