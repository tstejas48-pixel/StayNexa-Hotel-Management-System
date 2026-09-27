# StayFlow project tracker

**Current classification:** portfolio/demo prototype. Do not use with real hotel records or payments.

## Completed in this build

- [x] Responsive hotel operations dashboard with a persistent navigation shell.
- [x] Demo role switch, light/dark theme, keyboard shortcuts, notifications, and common operational navigation.
- [x] Seeded browser workspace: rooms, guests, bookings, housekeeping tasks, notifications, hotel services, and service orders.
- [x] Booking quote and room/date overlap validation helpers with unit tests.
- [x] Guest creation/profile notes and stay-history presentation.
- [x] Demo check-in, room status changes, checkout-to-housekeeping handoff, payment-state updates, and service-inclusive folios.
- [x] Invoice itemization and print/save-as-PDF stylesheet; taxes and service subtotal reconciled by a shared helper.
- [x] Shared folio and demo-cache version handling; older cached workspaces missing service fields are rejected.
- [x] Type check, unit suite, production build, and browser preview smoke journey.
- [x] GitHub-style README and screenshot gallery.

## Production blockers — required before real hotel use

- [ ] Model and migrate property-scoped entities: properties, rooms/room types, guests, bookings, staff, services/service orders, payments, invoices, housekeeping tasks, notifications, and audit events.
- [ ] Replace `localStorage` operational state with authenticated, property-scoped database persistence.
- [ ] Implement and test tRPC domain procedures for dashboard data, booking/availability, guest records, room status, service orders, payments, invoices, housekeeping, reporting, and settings.
- [ ] Enforce tenant isolation and server-side role permissions; the current client role selector is a visual preview only.
- [ ] Make booking availability/assignment transactional to prevent concurrent double booking.
- [ ] Add audit trails, safe conflict handling, idempotency, and recovery for financial/operational state changes.
- [ ] Integrate a real payment provider; define refunds, payment reconciliation, receipts, and secure webhook handling.
- [ ] Integrate real email delivery for invoices and notifications. Current “Send invoice” only displays a demo message.
- [ ] Validate invoice numbering, tax treatment, currency precision, privacy notices, data retention/deletion, and access controls for the intended jurisdiction.
- [ ] Add end-to-end browser tests for new booking, guest profile, service addition, payment, checkout, invoice printing, and housekeeping.
- [ ] Verify deployment with configured production secrets, database migrations, monitoring, backups, and restore procedures.

## Known limitations and polish

- [ ] The reporting page includes static demo figures; replace with database-backed metrics and date filters.
- [ ] The database schema currently contains only the scaffolded auth `users` table; hotel-domain records are not persisted server-side.
- [ ] Reduce the production JavaScript entry chunk (currently ~1.03 MB minified) with route-level code splitting, especially charts and secondary pages.
- [ ] Review and fix the pnpm package-manager configuration warning if upgrading/changing pnpm settings.
- [ ] Add loading, empty, permission-denied, and network-error states for future API-backed operations.
- [ ] Add deterministic stable IDs and duplicate-click protection to demo mutations before using those flows as API contracts.
- [ ] Re-check mobile screenshots after replacing demo data and wiring production APIs.
- [ ] Add the actual author profile and a project license before publishing the repository.

## Bugs

- No known blocking build/type/test failures at handoff. The browser demo cache compatibility issue discovered during checkout testing was fixed by validating the service fields and bumping the local key to `stayflow-demo-workspace-v4`.
