# Test Cases — Employee Lifecycle Management

Five spec files, tagged `@smoke` / `@regression` / `@api` (see [README](README.md#tagging--selective-execution)):

- [tests/auth.spec.ts](tests/auth.spec.ts) — login (valid/invalid) and logout/session
  invalidation, independent of the shared Admin storageState.
- [tests/employee-lifecycle.spec.ts](tests/employee-lifecycle.spec.ts) — create → edit → delete,
  as three independent, individually-reported `test()`s run in sequence
  (`test.describe.serial`), each with its own API cross-check.
- [tests/role-based-access.spec.ts](tests/role-based-access.spec.ts) — provisions a second user
  role (ESS) and verifies the Admin/ESS permission boundary.
- [tests/api/employee-api.spec.ts](tests/api/employee-api.spec.ts) — the same API behavior as
  three **standalone** tests (create / update / delete) that don't touch the browser or the
  OrangeHRM UI at all.

```bash
npm test               # everything except @quarantine-tagged tests
npm run test:smoke      # fast confidence check (@smoke)
npm run test:regression # full regression pass (@regression)
npm run test:ui         # only the UI specs (auth, lifecycle, role-based-access)
npm run test:api        # only the standalone API tests (tests/api/) — fast, no browser
```

## Authentication (`tests/auth.spec.ts`) — `@smoke`

| # | Test Case | Steps | Expected Result |
|---|---|---|---|
| AUTH01 | Login with valid credentials | Go to login page, enter Admin credentials (from `.env`), submit | Redirected to `/dashboard`, "Dashboard" breadcrumb visible |
| AUTH02 | Login with invalid credentials | Enter valid username with a wrong password, submit | "Invalid credentials" error shown, stays on login page |
| AUTH03 | Logout / session invalidation | Log in, open the user dropdown, click Logout; then navigate directly to `/dashboard` | Redirected to `/auth/login` on logout; the direct dashboard visit afterward is also bounced back to `/auth/login` (proves the session was actually invalidated) |

## Employee Lifecycle (`tests/employee-lifecycle.spec.ts`) — `@regression` (create is also `@smoke`)

Runs as three independent tests in a `test.describe.serial` block — each appears as its own
row in the HTML report, but they share the employee created in the first test since the flow is
inherently sequential (you can't edit or delete an employee that doesn't exist yet).

| # | Test Case | Steps | Expected Result |
|---|---|---|---|
| LC01 | Creates a new employee + verifies via API | PIM → Add Employee, fill First/Last Name + a unique Employee ID (data-driven from `data/employee.json`), upload a profile picture, Save; mirror the same fields as a `POST` to the simulated API (ReqRes) | "Successfully Saved" toast; Personal Details page shows the same Employee ID; API response echoes back identical first name, last name, and Employee ID |
| LC02 | Edits job details + verifies via API and UI reload | Search employee list by Employee ID, open the record, go to the Job tab, change Job Title and Employment Status, Save; `PUT` the same values to the simulated API; reload the Job tab in the UI | "Successfully Updated" toast; both fields display the new values; API response matches; UI still shows them after reload (confirms server-side persistence) |
| LC03 | Deletes the employee + verifies via UI and API | Search by Employee ID, delete via the row's trash icon, confirm the dialog | "Successfully Deleted" toast; re-searching the same ID shows "No Records Found"; `DELETE` on the simulated API returns `204` |

A `test.afterAll` fallback deletes the employee if the suite stops before LC03 runs (e.g. LC02
fails), so a mid-run failure doesn't leave data behind on the shared demo instance.

## Role-based access control (`tests/role-based-access.spec.ts`) — `@regression`

| # | Test Case | Steps | Expected Result |
|---|---|---|---|
| RBAC01 | Provisions an ESS-role user | Create a fresh employee, then Admin → User Management → Add User, role `ESS`, linked to that employee | System user created and searchable by username |
| RBAC02 | ESS user cannot see or reach Admin functionality | Log in as the ESS user in a fresh (non-Admin) session; inspect the side menu; navigate directly to `/admin/viewSystemUsers` | "Admin" menu item is absent (only ESS-scoped items like "My Info" are shown); direct navigation to the Admin route shows "Credential Required" instead of the System Users list |
| RBAC03 | Cleans up the ESS user + employee | Admin → User Management, delete the ESS user; PIM, delete the linked employee | Both removed; confirmed via search |

A `test.afterAll` fallback repeats the RBAC03 deletions if the suite stops before that test runs.

## Standalone API tests (`tests/api/employee-api.spec.ts`) — `@api` `@regression`

Each test creates its own record via the API first (no dependency on the UI tests or on each
other), then exercises one operation, using the shared `apiClient` fixture for setup/teardown
(see [src/fixtures.ts](src/fixtures.ts)).

| # | Test Case | Call | Expected Result |
|---|---|---|---|
| API01 | Create echoes submitted fields | `POST /api/users` | `201`; response body has an `id` and echoes `employeeId`, `firstName`, `lastName` |
| API02 | Update echoes new job fields | `POST` then `PUT /api/users/:id` | `200`; response echoes the updated `jobTitle` and `employmentStatus` |
| API03 | Delete removes the record | `POST` then `DELETE /api/users/:id` | `204 No Content` |

## Notes

- **Data-driven input**: employee name, profile picture path, and target job title/employment
  status live in [data/employee.json](data/employee.json). Credentials and target URLs live in
  `.env` (see [`.env.example`](.env.example)) — nothing is hardcoded in the test code. IDs and
  usernames are generated at run time so repeat runs never collide.
- **API validation**: the OrangeHRM demo has no public key-free REST API, so per the assessment's
  own suggestion these steps mirror each UI action against [ReqRes](https://reqres.in), a public
  echo-back test API, and assert the returned payload matches what was just entered/changed in
  the UI. See the README for the full rationale.
- **Flaky-test handling**: see [docs/TEST_STRATEGY.md](docs/TEST_STRATEGY.md).
- Every assertion carries a descriptive message, so a failure in the HTML report states what was
  expected and why without needing to open the trace.
