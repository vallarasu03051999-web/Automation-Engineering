# OrangeHRM Employee Lifecycle — Playwright Automation

End-to-end UI + API automation of the **Employee Lifecycle Management** scenario against the
[OrangeHRM demo site](https://opensource-demo.orangehrmlive.com/), built with
[Playwright](https://playwright.dev/) and TypeScript, using the Page Object Model.

Coverage: authentication (valid/invalid login, logout/session invalidation) → add an employee
(data-driven, with a profile picture) → edit the employee's job details → validate the record via
an API → delete the employee → a second user role (ESS) provisioned and checked against the
Admin/ESS permission boundary.

See [TEST_CASES.md](TEST_CASES.md) for the individual test cases and expected results, and
[docs/TEST_STRATEGY.md](docs/TEST_STRATEGY.md) for the flaky-detection/mitigation write-up.

## Framework structure

```
.
├── .github/workflows/
│   └── playwright.yml         # CI: install → run (sharded) → upload report/traces as artifacts
├── data/
│   └── employee.json          # Data-driven input: new-employee fields, job update
├── assets/
│   └── profile-picture.png    # Sample image uploaded during "Add Employee"
├── docs/
│   └── TEST_STRATEGY.md       # Flaky-test detection & mitigation strategy
├── src/
│   ├── config/
│   │   └── env.ts             # Loads .env / .env.<TEST_ENV>, exports typed config (no hardcoded URLs/creds)
│   ├── pages/                 # Page Object Model — one class per screen/area
│   │   ├── BasePage.ts        # Shared helpers: toast assertions, custom dropdown selection
│   │   ├── LoginPage.ts
│   │   ├── DashboardPage.ts
│   │   ├── SideMenuPage.ts    # Role-based menu-visibility assertions
│   │   ├── EmployeeListPage.ts
│   │   ├── AddEmployeePage.ts
│   │   ├── PersonalDetailsPage.ts
│   │   ├── JobDetailsPage.ts
│   │   └── AdminUserPage.ts   # Admin > User Management (add/search/delete system users)
│   ├── utils/
│   │   ├── apiClient.ts       # Generic HTTP wrapper (get/post/put/delete) + domain methods
│   │   ├── testDataLoader.ts  # Loads data/employee.json, generates unique IDs/usernames
│   │   └── logger.ts          # Leveled console logger used across fixtures/cleanup/API calls
│   ├── types/
│   │   └── employee.ts        # Shared TypeScript types for fixture data
│   └── fixtures.ts            # Playwright test fixtures wiring up all page objects + API client
├── tests/
│   ├── global-setup.ts        # Logs in once as Admin, persists storageState for reuse
│   ├── auth.spec.ts           # Login/logout — starts from a clean (unauthenticated) context
│   ├── employee-lifecycle.spec.ts  # create / edit / delete, as independent serial tests
│   ├── role-based-access.spec.ts   # Provisions + checks a second (ESS) user role
│   └── api/
│       └── employee-api.spec.ts    # Standalone API tests — no browser needed
├── playwright.config.ts       # Reporters, timeouts, video/trace/screenshot settings, storageState
├── tsconfig.json
└── package.json
```

### Design notes

- **Page Object Model**: every screen exposes intention-revealing methods (`login()`,
  `fillEmployeeDetails()`, `updateJobDetails()`, …) instead of leaking selectors into the test.
  `BasePage` centralizes the two patterns repeated across OrangeHRM's UI: reading the toast
  notification and operating its custom (non-native) dropdown widgets.
- **Environment-based configuration**: [`src/config/env.ts`](src/config/env.ts) loads `.env` and
  layers `.env.<TEST_ENV>` on top of it (`TEST_ENV` defaults to `local`) — nothing is hardcoded.
  `BASE_URL`, `API_BASE_URL` and Admin credentials all come from there. See
  [.env.example](.env.example) and [.env.staging.example](.env.staging.example), and "Running
  against a different environment" below.
- **Data-driven input**: the employee's name, profile picture path, and the job title/employment
  status used in the edit step all come from [`data/employee.json`](data/employee.json), not
  hardcoded in the test. IDs and usernames are generated at run time so repeat runs never collide.
- **storageState session reuse**: [`tests/global-setup.ts`](tests/global-setup.ts) logs in as
  Admin once per run and saves the session to `playwright/.auth/admin.json`; every spec except
  `auth.spec.ts` (which explicitly needs to start unauthenticated) reuses it via
  `playwright.config.ts`'s default `use.storageState`, instead of repeating the login flow.
- **Independent, tagged test cases**: the employee lifecycle and role-based-access flows are each
  split into independent `test()`s (via `test.describe.serial`, since the stages are inherently
  sequential) rather than one long `test.step()`-driven test, so each stage is reported and can
  be filtered on its own. Tests are tagged `@smoke` / `@regression` / `@api` — see "Tagging &
  selective execution" below.
- **Descriptive assertions**: every `expect(...)` call carries a message describing what should be
  true and why, so a failure in the HTML report is legible without opening the trace.
- **Reusable API client**: [`ApiClient`](src/utils/apiClient.ts) exposes a generic
  `get/post/put/delete` HTTP wrapper (logging + error handling in one place) with small
  domain-specific methods built on top, rather than one bespoke method per endpoint.
- **API validation step**: the OrangeHRM demo instance does not expose a public, key-free REST API
  for PIM records (its real API requires an authenticated session and CSRF token). Per the
  assessment's own guidance ("simulate API with any public test API like ReqRes"), the lifecycle
  mirrors each UI action (create → update → delete) against [ReqRes](https://reqres.in/), a
  public test API that echoes back whatever payload it's sent, and asserts the returned payload
  matches what was just entered/changed in the UI.
- **Role-based access control**: [`role-based-access.spec.ts`](tests/role-based-access.spec.ts)
  provisions a second user role (ESS, linked to a fresh employee via Admin > User Management),
  logs in as that user in an isolated context, and asserts the Admin/ESS permission boundary: the
  "Admin" menu item is absent and a direct navigation to an Admin route is blocked
  ("Credential Required") rather than only ever exercising the suite as Admin.
- **Cleanup independent of the happy path**: both `employee-lifecycle.spec.ts` and
  `role-based-access.spec.ts` register a `test.afterAll` fallback that deletes any
  employee/system user left behind if an earlier stage in the file fails before its own cleanup
  step runs.
- **Logging**: [`src/utils/logger.ts`](src/utils/logger.ts) provides leveled
  (`debug/info/warn/error`) timestamped logging, used by `ApiClient` (every request/response) and
  by the fallback-cleanup hooks.

## Setup

**Prerequisites:** Node.js 18+.

```bash
npm install
npx playwright install chromium
cp .env.example .env   # adjust if needed — defaults already point at the public demo
```

## Running the tests

```bash
npm test                # everything except @quarantine-tagged tests (see docs/TEST_STRATEGY.md)
npm run test:smoke       # fast confidence check (@smoke)
npm run test:regression  # full regression pass (@regression)
npm run test:ui          # UI specs: auth, lifecycle, role-based-access
npm run test:api         # only the standalone API tests (tests/api/) — fast, no browser
npm run test:headed      # lifecycle spec with a visible browser
npm run test:debug       # Playwright Inspector, step through a run
npm run report           # open the last HTML report
```

After a run, the report is at `playwright-report/index.html` (open it directly, or run
`npm run report`). Video recordings and traces for the run are embedded in that report.

### Tagging & selective execution

| Tag | Meaning | Run with |
|---|---|---|
| `@smoke` | Fast, high-value confidence check (login, employee creation) | `npm run test:smoke` |
| `@regression` | Full behavioral coverage | `npm run test:regression` |
| `@api` | Standalone API-only tests, no browser | `npm run test:api` |
| `@quarantine` | Confirmed environment-driven flake, excluded from the default gate | `npm run test:quarantine` |

Tags are declared per `test()`/`test.describe()` (e.g. `test('...', { tag: '@smoke' }, ...)`) and
selected with Playwright's `--grep`/`--grep-invert`.

### Running against a different environment

`TEST_ENV` selects a layered `.env` override (see [`src/config/env.ts`](src/config/env.ts)):

```bash
npm run test:staging   # TEST_ENV=staging → applies .env.staging on top of .env
```

Copy [`.env.staging.example`](.env.staging.example) to `.env.staging` and fill in real values to
use this against an actual non-public environment; only the keys that differ from `.env` need to
be listed.

## CI/CD

[`.github/workflows/playwright.yml`](.github/workflows/playwright.yml) runs on every push/PR to
`main`: installs dependencies, installs the Chromium browser, runs the suite (excluding
`@quarantine`) split across 2 shards for parallelization, and uploads the HTML report and raw
`test-results/` (traces, videos) as build artifacts on every run — pass or fail — so a failure can
be triaged from the Actions run without re-running locally. `BASE_URL`/`API_BASE_URL`/Admin
credentials are read from repo variables/secrets with the public demo's own values as a fallback,
so the workflow runs out of the box without any secrets configured.

## Dependencies

| Package | Purpose |
|---|---|
| `@playwright/test` | Browser automation, test runner, assertions, API request context, HTML reporter |
| `typescript` | Type-checked page objects, fixtures and test code |
| `@types/node` | Node typings (used by `testDataLoader.ts`/`env.ts` for `fs`/`path`) |
| `dotenv` | Loads `.env`/`.env.<TEST_ENV>` for environment-based configuration |
| `cross-env` | Sets `TEST_ENV` cross-platform in the `test:staging` npm script |

## Notes on the target site

`opensource-demo.orangehrmlive.com` is a shared public demo instance and is occasionally slow to
respond. `playwright.config.ts` sets generous navigation/action timeouts and `retries: 2` to
absorb that transient slowness. See [docs/TEST_STRATEGY.md](docs/TEST_STRATEGY.md) for the full
detection/mitigation strategy, including how this is distinguished from genuine test bugs.
