# Test Cases — Employee Lifecycle Management

Two spec files:

- [tests/employee-lifecycle.spec.ts](tests/employee-lifecycle.spec.ts) — the full UI scenario, run
  as six sequential `test.step()`s so each stage shows individually in the HTML report. Its API
  cross-checks (TC02b, TC04, TC05's delete check) run inline, against the record the UI just
  created, and need a browser.
- [tests/api/employee-api.spec.ts](tests/api/employee-api.spec.ts) — the same API behavior as
  three **standalone** tests (create / update / delete) that don't touch the browser or the
  OrangeHRM UI at all, for when you want to check the API layer alone.

```bash
npm test          # everything (4 tests: 1 UI scenario + 3 standalone API tests)
npm run test:ui    # only the UI scenario (tests/employee-lifecycle.spec.ts)
npm run test:api   # only the standalone API tests (tests/api/) — fast, no browser
```

## UI scenario (`tests/employee-lifecycle.spec.ts`)

| # | Test Case | Steps | Expected Result |
|---|---|---|---|
| TC01 | Login with valid credentials | Go to login page, enter `Admin` / `admin123`, submit | Redirected to `/dashboard`, "Dashboard" breadcrumb visible |
| TC02 | Add a new employee | PIM → Add Employee, fill First/Last Name + a unique Employee ID (data-driven from `data/employee.json`), upload a profile picture, Save | "Successfully Saved" toast; Personal Details page shows the same Employee ID |
| TC02b | Cross-check created employee via API | Mirror the same first/last name + Employee ID as a `POST` to the simulated API (ReqRes) | API response echoes back the identical first name, last name, and Employee ID |
| TC03 | Edit employee — Job Title & Employment Status | Search employee list by Employee ID, open the record, go to the Job tab, change Job Title and Employment Status, Save | "Successfully Updated" toast; both fields display the new values |
| TC04 | Validate employee via API after edit | `PUT` the same Job Title/Employment Status to the simulated API; reload the Job tab in the UI | API response matches the values just set in the UI; UI still shows them after reload (confirms server-side persistence, not just local state) |
| TC05 | Delete the employee | Search by Employee ID, delete via the row's trash icon, confirm the dialog | "Successfully Deleted" toast; re-searching the same ID shows "No Records Found"; `DELETE` on the simulated API returns `204` |
| TC06 | Logout / session invalidation | Open the user dropdown, click Logout; then navigate directly to `/dashboard` | Redirected to `/auth/login` on logout; the direct dashboard visit afterward is also bounced back to `/auth/login` (proves the session was actually invalidated, not just that the logout link redirected once) |

## Standalone API tests (`tests/api/employee-api.spec.ts`)

Each test creates its own record via the API first (no dependency on the UI test or on each
other), then exercises one operation:

| # | Test Case | Call | Expected Result |
|---|---|---|---|
| API01 | Create echoes submitted fields | `POST /api/users` | `201`; response body has an `id` and echoes `employeeId`, `firstName`, `lastName` |
| API02 | Update echoes new job fields | `POST` then `PUT /api/users/:id` | `200`; response echoes the updated `jobTitle` and `employmentStatus` |
| API03 | Delete removes the record | `POST` then `DELETE /api/users/:id` | `204 No Content` |

## Notes

- **Data-driven input**: employee name, profile picture path, target job title/employment status,
  and login credentials all live in [data/employee.json](data/employee.json) — nothing is
  hardcoded in the test. The Employee ID is generated at run time so repeat runs never collide.
- **API validation (TC02b, TC04, TC05)**: the OrangeHRM demo has no public key-free REST API, so
  per the assessment's own suggestion these steps mirror each UI action against
  [ReqRes](https://reqres.in), a public echo-back test API, and assert the returned payload
  matches what was just entered/changed in the UI. See the README for the full rationale.
- Every assertion carries a descriptive message, so a failure in the HTML report states what was
  expected and why without needing to open the trace.
