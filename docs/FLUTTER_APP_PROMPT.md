# Meridian ERP — Flutter App Development Prompt

> Copy-paste this entire document as the brief for an AI assistant or development team.
> It describes a complete Flutter mobile client for the existing Meridian ERP backend.

---

You are building **Meridian ERP Mobile**, a Flutter app for Meridian Logistics DMCC — a full
mobile client of an existing HR / Finance / Projects / Procurement ERP. The web app already
exists (React micro-frontends); your job is to deliver the same functionality on mobile,
talking to the **existing Express + MongoDB REST API**. You must not require any backend
changes — the API contract below is fixed.

The app serves **two roles** from one binary:

- **Admin** — the full ERP: dashboard, People & Culture (HR), Finance, Procurement,
  Projects, a live notifications work queue, and their own employee portal.
- **Employee** — a self-service portal only: Home, My Projects, Leave, Attendance,
  Payslip, My Profile. Employees must never see or reach admin screens (the API also
  enforces this server-side).

---

## 1 · Backend contract (fixed — do not change)

### Base URL
- Default `http://localhost:5000/api`. Make it configurable: `--dart-define=API_BASE=…`
  plus an override field on the login screen (gear icon).
- Android emulator reaches the host machine at `http://10.0.2.2:5000/api`; iOS simulator
  uses `http://localhost:5000/api`. Physical devices need the host LAN IP.
- Uploaded files are served from the same origin **without** the `/api` prefix:
  `filePath` values like `/uploads/abc.pdf` resolve against `http://localhost:5000`.

### Authentication
- `POST /auth/login` body `{ "email", "password" }` →
  `{ "token": "<JWT>", "user": { "id", "name", "email", "role", "userRole", "empId", "avatar": { "bg", "fg" } } }`
  - `userRole` is `"admin"` or `"employee"` and drives all navigation.
  - `role` is the job title (display only). `avatar` holds chip colors.
- Send `Authorization: Bearer <token>` on **every** request. Tokens expire (~8h);
  on any 401, clear the session and return to login.
- `GET /auth/me` → fresh `user` object (call on app start to validate a stored token).
- `GET /auth/my-profile` → `{ user, employee }` — the signed-in user's full HR record
  (powers My Profile). Returns 404 `{ "message": "No employee record linked…" }` if the
  account has no `empId`; show a friendly empty state, not a crash.

### Authorization tiers (mirror them in the UI)
- **Any signed-in user**: `/leave-requests`, `/leave-types`, `/payroll`, `/projects`.
- **Admin only** (API returns 403 otherwise): `/dashboard`, `/employees`, `/departments`,
  `/attendance`, `/headcount`, `/activity`, `/calendar-events`, `/onboarding`, `/openings`,
  `/candidates`, `/renewals`, `/benefits`, `/shifts`, `/courses`, `/documents`,
  `/salary-structures`, `/review-cycles`, `/appraisals`, `/org-goals`, `/notes`,
  `/parties`, `/cashbook`, `/daybook`, `/expenses`, `/invoices`, `/quotations`,
  `/procurement`, `/reports/*`, `/auth/users*`.

### Conventions
- Mostly flat CRUD: `GET /x` (list), `POST /x`, `PATCH /x/:id`, `DELETE /x/:id`.
- **Records are keyed by human-readable business IDs**, never Mongo `_id`:
  `empId` ("EMP-2451"), `leaveId`, `expenseId`, `invoiceId`, `quotationId`, `partyId`,
  `entryId`, `procId`, `projectId`, `deptId`. Use these in URLs and as list keys.
- Errors come back as `{ "error": "<message>" }` with HTTP 400 (validation) or 500;
  auth failures as `{ "message": "…" }` with 401/403/404. Surface the message text.
- Dates are plain strings (`"2026-05-21"` or formatted); money is AED. Format as
  `AED 1,234.56` with `intl`.
- **Demo data lives in May 2026.** Dashboards/attendance default to the pinned demo date
  (the web app uses `?date=2026-05-21`). If a screen looks empty, check the date filter
  first — do not assume "today".

### Seeded test accounts
| Role | Email | Password | Notes |
|---|---|---|---|
| Admin | `admin@meridian.ae` | `admin123` | Linked to EMP-2840 (has own portal/profile) |
| Admin | `daniyal@meridian.ae` | `admin123` | Linked to EMP-3122 |
| Employee | `aarav.s@meridian.ae` | `emp123` | EMP-2451 — every employee is `<name>@meridian.ae` / `emp123` |

### Key resource shapes (fields the UI needs)
- **Employee**: `empId, name, title, dept, location, grade, manager, joined, contract,
  email, phone, nationality, status, avatar, leave:{annual,used}, visaExpires, eidExpires`.
- **LeaveRequest**: `leaveId, empId, emp, dept, type, typeLbl, from, to, days, reason,
  status: pending|approved|declined, submitted, approver`.
- **Expense**: `expenseId, empId, empName, amount, currency, date, desc, cat,
  paymentType, status: pending|approved|reimbursed|rejected, party, projectName, notes,
  attachments:[{fileName, filePath, fileSizeMB}]`.
  Upload via `POST /expenses/:expenseId/attachments` (multipart).
- **Invoice**: `invoiceId, quotationId, date, dueDate, currency, clientName, clientAddress,
  clientPhone, clientEmail, projectTitle, items:[{category, description, unit, qty, unitPrice}],
  subtotal, discountPct, discountAmt, taxPct, taxAmt, grandTotal, amountPaid, balanceDue,
  status: unpaid|partial|paid|overdue|cancelled, paymentTerms, notes`.
  Record payment = `PATCH /invoices/:invoiceId { amountPaid }` (cumulative).
- **Quotation**: similar to invoice + `status: draft|sent|approved|rejected|expired`;
  converting an approved quote creates the invoice.
- **Party**: `partyId, name, type: vendor|client|…, contactPerson, phone, email, address,
  bankName, bankAccount, bankIBAN, taxNumber, status: active|inactive, notes`.
- **Cash Book entry**: `entryId, entryType: receipt|payment, description, amount, date,
  category, party, paymentMode, reference, notes`. The web app also merges approved
  expenses into the ledger view client-side — replicate that.
- **Day Book entry**: `entryId, entryType, description, debit, credit, date, account,
  party, reference, notes`.
- **Procurement request**: `procId, title, projectName, department, raisedBy, priority,
  description, estValue, vendor, currentStage, status: in_progress|completed|on_hold|cancelled,
  items[] (BOQ lines), categoryVendors[], categoryAwards[], purchaseOrders[]
  (status draft|issued), paymentApplications[] (status draft|submitted|certified),
  quoteFiles[], proformaFile, history[]`.
  **11 lifecycle stages** (keys are snake_case in `currentStage`): Enquiry → Prepare List →
  Quotation (RFQ) → Comparison → Approval → LPO Issue → Proforma Invoice →
  Payment Application → Payment Approval → Payment Release → Logistics.
- **Project**: `projectId, title, type, stage: quotation|discussion|approved|
  advance_collected|work_started|completed|on_hold|cancelled, priority, partyName,
  location, lat, lng, assignedTo, description, quotation*/approved*/advance*/work*/completion*
  fields, discussions:[{date, by, notes, outcome}], notes`.
- **Reports**: `GET /reports/project-pnl` → `{ rows:[{projectId, title, partyName, stage,
  totalIncome, totalCost, netProfit, margin, …}], grand }`;
  `GET /reports/project-pnl/:projectId` → `{ transactions:[{source, direction, amount,
  date, description, party}] }`.
- **Payroll**: `GET /payroll/latest` → `{ lines:[{empId, …salary breakdown…}] }` — match
  the signed-in user's line by `empId` for the payslip.

---

## 2 · App architecture

- **Flutter 3.x / Dart 3**, null-safe, feature-first folder layout:
  `lib/core/` (api client, theme, router, widgets) and `lib/features/<module>/`
  (data / providers / screens / widgets).
- **State management**: Riverpod (`flutter_riverpod`). **Routing**: `go_router` with an
  auth redirect guard and a role-based shell (admin shell vs employee shell).
- **Packages**: `dio` (interceptor adds JWT, maps `{error}` bodies to typed failures,
  401 → logout), `flutter_secure_storage` (token), `intl`, `pdf` + `printing`
  (document export/share — see §5), `fl_chart` (dashboard), `cached_network_image`,
  `url_launcher` (attachments), `shared_preferences` (theme, read-notifications).
- Every list screen: loading skeleton, error state with retry, empty state,
  pull-to-refresh. Paginate client-side where the web does (15–25 rows/page is fine).
- Keep models as plain Dart classes with `fromJson`; tolerate missing/extra fields
  (the API omits empty fields freely).

---

## 3 · Navigation & screens

### Shared
- **Login** — split brand panel + form, seeded-credentials hint, API-base override.
  On success store token + user; route by `userRole`.
- **Theme picker** — 4 accent palettes (see §4), persisted; selectable from profile menu.

### Admin shell
Bottom navigation (5 tabs) + top app bar with **notifications bell** and profile menu:

1. **Overview** — KPI dashboard from `/dashboard` (+ `/headcount`, `/activity`):
   pending approvals, headcount, attendance today, pipeline value, income vs expense
   and P&L charts. Each KPI deep-links to its module.
2. **Procurement** — sub-tabs: Lifecycle (list of requests with stage chips and an
   11-step stage tracker), Material & Labour (BOQ per request, category totals,
   budget variance), Quote Comparison (vendors per category, awards), Purchase Orders
   (one LPO per awarded vendor), Payment Apps. All sub-views share `/procurement` data.
3. **People & Culture** — Employees directory (search/filter, profile sheet), Leave
   (approve/decline pending requests), Attendance (pinned demo date!), Payroll & Salary,
   plus secondary screens: Org Chart, Onboarding, Recruitment, Documents, Shifts,
   Benefits, Performance, Training. "My Portal" opens the same employee portal screens
   the employee role gets (admins are linked to their own employee record).
4. **Finance** — Expenses (approve → reimburse flow, attachments, category breakdown),
   Cash Book (receipts vs payments, running balance, date range), Day Book
   (debit/credit journal, per-day tabs), Parties (vendor/client directory with bank
   details), Quotations (status pills: draft/sent/approved/rejected/expired),
   Invoices (record payment, balance due, overdue highlighting).
5. **Projects** — Pipeline (stage board or grouped list: quotation → … → completed,
   with priority chips and amounts), project detail (stage tracker, map preview from
   lat/lng, discussions log, advance-stage action), P&L Report (per-project income/
   cost/net/margin + transaction breakdown).

**Record pattern used everywhere**: list → tappable row → detail (bottom sheet or page)
→ **Full View** (the record rendered as a clean printable document page: header with
business ID + status chip, meta grid, line-item tables, totals) → **Share PDF** button.

### Employee shell
Bottom navigation: **Home** (greeting, leave balance, pending count, doc-expiry alerts,
quick actions) · **My Projects** (projects where they're assignee/site engineer) ·
**Leave** (balance, history, request form: type/from/to/days/reason → `POST /leave-requests`) ·
**Attendance** (their month view) · **Payslip** (latest payroll line, salary breakdown) ·
**My Profile** (Personal / Employment / Location / Documents cards from `my-profile`;
hide the visa row for UAE nationals).

### Notifications (admin)
Bell with unread-count badge; poll every 60 s and on open. Derive items client-side —
same rules as the web shell:
- `/leave-requests` where `status == "pending"` → "Leave request · {emp}" → People tab
- `/expenses` where `status == "pending"` → "Expense awaiting review" → Finance tab
- `/invoices` where `status == "overdue"` OR (`unpaid|partial` && `balanceDue > 0` &&
  `dueDate < today`) → "Invoice past due" → Finance tab
- `/procurement` where `status == "in_progress"` && `currentStage` contains `approval`
  → "Procurement awaiting approval" → Procurement tab
Read state is local (persist seen IDs in `shared_preferences`); "Mark all read" clears
the badge. Tapping an item navigates to the module.

---

## 4 · Design system

Identity: professional, dense, document-centric ERP. Light surfaces, one strong accent.

**Accent palettes** (user-selectable, Burgundy is default):

| Accent | Primary | Magenta | Pink | Plum 700 | Plum 100 | Plum 50 |
|---|---|---|---|---|---|---|
| Burgundy | `#6F1947` | `#B61B54` | `#F5989D` | `#5B1239` | `#F4DDE8` | `#FBF3F7` |
| Indigo | `#3B3E8F` | `#5C4FC6` | `#A6B0E8` | `#2D2F70` | `#DCDFF1` | `#F0F1FA` |
| Forest | `#1F5A3D` | `#2E7D54` | `#A8D2B9` | `#163F2B` | `#D2E8DB` | `#EEF6F1` |
| Charcoal | `#2A2326` | `#5C5156` | `#A89DA3` | `#1A1316` | `#E6E1E4` | `#F3F0F2` |

Map to a Material 3 `ColorScheme` (primary = accent, secondary = magenta) via a
`ThemeExtension` carrying the plum scale.

**Status colors** (used consistently across the web app — keep them):
success/approved/paid `#1F8A52` on `#ECFDF5` · warning/pending/partial `#D78A14` on
`#FEF3C7` · danger/overdue/rejected `#C0263A` on `#FFF1F2` · info `#2563B0` ·
neutral/cancelled `#A89DA3`. Status chips: pill, 11–12 px bold label, tinted background.

Typography: Inter (or system), 12.5–14 px body, uppercase letter-spaced micro-labels
for field names, monospace for business IDs. KPI cards: big number + small caption +
tinted icon square. Branding: "M" logo square in accent, "Meridian ERP / Logistics DMCC".

---

## 5 · Document PDF export

Full View screens must export/share a PDF (this exists on the web — feature parity):
- Build the document natively with the `pdf` package (A4, brand header with the "M"
  mark + company block, document type banner like TAX INVOICE, meta grid, autotable-style
  line items with the accent header row, totals block, terms/notes) and hand it to
  `printing`'s `sharePdf`/`layoutPdf`.
- File name = business ID, e.g. `INV-MQ723PGZ-full-view.pdf`.
- Documents to cover: invoice, quotation, expense voucher, cash/day-book voucher,
  party profile, procurement request (summary + lifecycle + BOQ + awards + LPOs +
  payment apps + history), project summary, project P&L breakdown.

---

## 6 · Milestones

1. **M1 Foundation** — project setup, theming + accent picker, API client, login,
   token persistence + `/auth/me` boot check, role-based shells, error/empty kit.
2. **M2 Employee portal** — all six portal screens + leave request flow.
3. **M3 People & Culture** — directory, leave approvals, attendance, payroll/salary,
   secondary HR screens.
4. **M4 Finance** — expenses, cash book, day book, parties, quotations, invoices
   (+ record payment), full views.
5. **M5 Procurement & Projects** — lifecycle + 4 procurement sub-modules, project
   pipeline + detail + P&L report.
6. **M6 Cross-cutting** — dashboard, notifications work queue, PDF export everywhere.
7. **M7 Polish & QA** — offline/error hardening, performance, accessibility,
   acceptance walkthrough.

---

## 7 · Acceptance criteria

- Admin login (`admin@meridian.ae`/`admin123`): all five tabs populate from seeded data;
  the bell shows a double-digit work queue (pending leaves + expenses, past-due invoices,
  approval-stage procurements) and items deep-link; approving a leave request updates the
  list and the queue; recording an invoice payment updates balance due and status;
  invoice Full View shares a correct PDF; "My Portal" shows EMP-2840's profile.
- Employee login (`aarav.s@meridian.ae`/`emp123`): sees only the portal; My Profile shows
  EMP-2451; can submit a leave request (visible to the admin as pending); payslip shows
  their payroll line; never sees admin data (and gracefully handles 403s if forced).
- Attendance/dashboard screens are non-empty because they respect the **May 2026** demo
  date; expired tokens land on login with a "session expired" notice; API base override
  works against a LAN backend; all four accent themes render correctly.
