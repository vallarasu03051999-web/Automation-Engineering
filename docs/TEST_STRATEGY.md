# Test Stability Strategy — Flaky Detection & Mitigation

This project targets a shared, public demo instance
(`opensource-demo.orangehrmlive.com`) that many people use simultaneously and that is
occasionally slow to respond. That's a source of *environmental* flakiness distinct from
flakiness caused by badly-written tests, so this document covers both: how the suite avoids
causing its own flakiness, and how it detects and contains flakiness coming from the target
environment.

## 1. Avoiding self-inflicted flakiness

- **No arbitrary sleeps.** Every wait is a Playwright auto-waiting assertion
  (`expect(...).toBeVisible()`, `page.waitForURL(...)`) or an explicit `waitForSelector`.
  There is no `waitForTimeout`/sleep-based synchronization anywhere in `src/` or `tests/`.
- **Race conditions handled explicitly.** [`AddEmployeePage.save()`](../src/pages/AddEmployeePage.ts)
  asserts the success toast and the SPA route change with `Promise.all(...)` because the toast
  auto-dismisses within a few seconds and would otherwise be gone by the time a sequential
  `await` got to it.
- **Independent, atomic test data.** Every run generates a fresh Employee ID / username from a
  timestamp suffix ([`testDataLoader.ts`](../src/utils/testDataLoader.ts)), so repeat runs (or
  parallel CI shards) never collide with a previous run's records.
- **Cleanup independent of the happy path.** `employee-lifecycle.spec.ts` and
  `role-based-access.spec.ts` both register a `test.afterAll` fallback that deletes any
  employee/system user left behind if an earlier stage in the file failed before its own
  cleanup step ran, so a mid-run failure doesn't permanently litter the shared demo instance.

## 2. Absorbing target-environment slowness

- `playwright.config.ts` sets generous `actionTimeout`/`navigationTimeout` values and
  `retries: 2`, specifically to absorb the public demo's occasional slow responses rather than
  fail a whole run over transient network/server latency that has nothing to do with the code
  under test.
- Retries are a *mitigation*, not a way to hide real bugs: a test that only passes on retry is
  flaky by definition, and Playwright's HTML report marks it "flaky" (not "passed") — see below.

## 3. How flaky tests are identified

- **Per-run signal — the HTML report's "flaky" bucket.** Any test that fails at least once but
  eventually passes within its configured retries is reported by Playwright as **flaky**, shown
  distinctly from tests that passed cleanly on the first attempt. After every run, the report is
  reviewed for flaky (not just failed) tests, since a growing flaky count on the same test is an
  early signal something needs fixing before it starts failing outright.
- **Cross-run signal — CI history.** The CI workflow (`.github/workflows/playwright.yml`) uploads
  the HTML report and raw `test-results/` (traces, videos) as build artifacts on every run,
  pass or fail. Comparing which specs show up in the flaky/failed bucket across recent runs
  (via the Actions run history) is how a pattern — as opposed to a one-off network blip — gets
  identified. At larger scale, this is the same signal a blob-report merge
  (`playwright merge-reports`) plus a trend dashboard (e.g. Allure, Currents, or a simple
  results.json time series) would formalize; it's intentionally kept lightweight here to match
  the size of this project.

## 4. Mitigation once a test is confirmed flaky

- **Root-cause first.** The default assumption is the test is wrong (a missing wait, an
  assertion that's too strict, a race condition) — not the environment — and it gets fixed at
  the source before anything else.
- **Quarantine tag for genuinely environment-driven flakiness.** For flakiness that's confirmed
  to originate from the shared public demo (not the test), tag the test `@quarantine` in
  addition to its normal tags. The main CI gate runs with `--grep-invert @quarantine` so a
  known-flaky test can't block merges while it's being fixed, but nothing is silently deleted:
  `npm run test:quarantine` runs quarantined tests on their own so regressions/recoveries are
  still visible, and the tag is a searchable TODO (`grep -r "@quarantine" tests/`) rather than a
  silent skip.
