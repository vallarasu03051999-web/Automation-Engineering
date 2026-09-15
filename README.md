# OrangeHRM Employee Lifecycle — Playwright Automation

End-to-end UI + API automation of the **Employee Lifecycle Management** scenario against the
[OrangeHRM demo site](https://opensource-demo.orangehrmlive.com/), built with
[Playwright](https://playwright.dev/) and TypeScript, using the Page Object Model.

The single scenario covers, in order: login → add an employee (data-driven, with a profile
picture) → edit the employee's job details → validate the record via an API → delete the
employee → logout with session-invalidation check.

See [TEST_CASES.md](TEST_CASES.md) for the individual test cases and expected results.

## Framework structure

```
.
├── data/
│   └── employee.json          # Data-driven input: new-employee fields, job update, credentials
├── assets/
│   └── profile-picture.png    # Sample image uploaded during "Add Employee"
├── src/
│   ├── pages/                 # Page Object Model — one class per screen/area
│   │   ├── BasePage.ts        # Shared helpers: toast assertions, custom dropdown selection
│   │   ├── LoginPage.ts
│   │   ├── DashboardPage.ts
│   │   ├── EmployeeListPage.ts
│   │   ├── AddEmployeePage.ts
│   │   ├── PersonalDetailsPage.ts
│   │   └── JobDetailsPage.ts
│   ├── utils/
│   │   ├── apiClient.ts       # API validation step (see "API validation" below)
│   │   └── testDataLoader.ts  # Loads data/employee.json, generates a unique Employee ID
│   ├── types/
│   │   └── employee.ts        # Shared TypeScript types for the fixture data
│   └── fixtures.ts            # Playwright test fixtures wiring up all page objects + API client
├── tests/
│   ├── employee-lifecycle.spec.ts   # The end-to-end UI scenario, one test.step() per lifecycle stage
│   └── api/
│       └── employee-api.spec.ts     # Standalone API tests (create/update/delete) — no browser needed
├── playwright.config.ts       # Reporters, timeouts, video/trace/screenshot settings
├── tsconfig.json
└── package.json
```

### Design notes

- **Page Object Model**: every screen exposes intention-revealing methods (`login()`,
  `fillEmployeeDetails()`, `updateJobDetails()`, …) instead of leaking selectors into the test.
  `BasePage` centralizes the two patterns repeated across OrangeHRM's UI: reading the toast
  notification and operating its custom (non-native) dropdown widgets.
- **Data-driven input**: the employee's name, profile picture path, and the job title/employment
  status used in the edit step all come from [`data/employee.json`](data/employee.json), not
  hardcoded in the test. The Employee ID itself is generated at run time
  (`QA` + last 6 digits of a timestamp) so repeat runs never collide with a previous run's record.
- **Descriptive assertions**: every `expect(...)` call carries a message describing what should be
  true and why, so a failure in the HTML report is legible without opening the trace.
- **API validation step**: the OrangeHRM demo instance does not expose a public, key-free REST API
  for PIM records (its real API requires an authenticated session and CSRF token). Per the
  assessment's own guidance ("simulate API with any public test API like ReqRes"), step 4 mirrors
  each UI lifecycle action (create → update → delete) against [ReqRes](https://reqres.in/), a
  public test API that echoes back whatever payload it's sent. The test asserts that the payload
  the mirrored API call returns matches what was just entered/changed in the UI, which is the
  practical shape "cross-check API data against UI data" takes without a real backend to query.
- **Standalone API tests**: [`tests/api/employee-api.spec.ts`](tests/api/employee-api.spec.ts)
  exercises the same `ApiClient` (create/update/delete) as three independent tests that create
  their own data and never touch a browser — useful for checking the API layer on its own via
  `npm run test:api`, separate from the full UI scenario.

## Setup

**Prerequisites:** Node.js 18+.

```bash
npm install
npx playwright install chromium
```

## Running the tests

```bash
npm test              # everything: the UI scenario + the standalone API tests
npm run test:ui        # only the UI scenario (tests/employee-lifecycle.spec.ts)
npm run test:api       # only the standalone API tests (tests/api/) — fast, no browser
npm run test:headed    # UI scenario with a visible browser
npm run test:debug     # Playwright Inspector, step through a run
npm run report         # open the last HTML report
```

After a run, the report is at `playwright-report/index.html` (open it directly, or run
`npm run report`). Video recordings and traces for the run are embedded in that report.

## Dependencies

| Package | Purpose |
|---|---|
| `@playwright/test` | Browser automation, test runner, assertions, API request context, HTML reporter |
| `typescript` | Type-checked page objects, fixtures and test code |
| `@types/node` | Node typings (used by `testDataLoader.ts` for `fs`/`path`) |

## Notes on the target site

`opensource-demo.orangehrmlive.com` is a shared public demo instance and is occasionally slow to
respond. `playwright.config.ts` sets generous navigation/action timeouts and `retries: 2` to
absorb that transient slowness — this reflects the target environment, not flakiness in the test
logic itself.
