# Rider Go-Live Progress

## Stage 1 - Rider Scope Lock
Status: Completed

### Frontend
- Added rider app shell route: `app/driver/page.tsx`.
- Added rider-only dashboard layout with:
  - pending assignments
  - active deliveries
  - completed deliveries
  - recent assignments list
- Updated header nav for riders:
  - approved riders -> `"/driver"`
  - non-approved riders -> `"/onboarding/driver"`
  - file: `components/app/app-header.tsx`

### Backend
- Added rider order-state machine module:
  - `app/lib/driver-flow.ts`
  - includes rider-visible statuses and allowed transitions
  - includes helper guards:
    - `canDriverTransitionOrderStatus`
    - `isDriverVisibleOrderStatus`

### Routing
- Updated post-login role routing for drivers:
  - approved drivers -> `"/driver"`
  - others -> `"/onboarding/driver"`
  - file: `app/lib/role-routing.ts`

## Stage 2 - Demo-Friendly Rider Onboarding
Status: Completed

### Frontend
- Kept one-click rider onboarding UX.
- Updated copy to explicitly state demo-safe auto profile creation and reduced manual verification.
- Added approved-state CTA to open rider dashboard.
- file: `app/(auth)/onboarding/driver/page.tsx`

### Backend
- Rider onboarding now sets status directly to `APPROVED` after profile auto-generation.
- Redirects rider straight to `"/driver"` after activation.
- file: `app/(auth)/onboarding/driver/page.tsx`

## Notes
- Signup/login flow was not modified.
- Email verification flow was not modified.

## Next Stage
- Stage 3: Rider access guards hardening and shared guard utility for all rider actions/routes.

## Stage 3 - Rider Access Guards
Status: Completed

### Frontend
- Rider dashboard now uses a shared rider access guard.
- file: `app/driver/page.tsx`

### Backend
- Added shared guard utility:
  - `app/driver/_lib/access.ts`
  - checks session, role, suspension, email verification, approved status, and profile existence.

## Stage 4 - Assignment Data Layer
Status: Completed

### Backend
- Added assignment data module:
  - `app/lib/db/driver-assignments.ts`
  - functions:
    - `listDriverAssignments`
    - `createDriverAssignment`
    - `acceptDriverAssignment`
    - `rejectDriverAssignment`
- Added idempotent handling and state checks for accept/reject flows.
- Added centralized exports:
  - `app/lib/db/index.ts`
- Added rider server actions for assignment decisions:
  - `app/lib/driver-actions.ts`
  - actions:
    - `acceptAssignment`
    - `rejectAssignment`

### Notes
- Assignment create flow enforces:
  - driver must be approved and not suspended
  - order must be assignable
  - duplicate assignment handling is idempotent for same driver

## Stage 5 - Dispatch Entry Point
Status: Completed

### Frontend
- Added rider dispatch controls in restaurant orders hub for `READY_FOR_PICKUP` orders.
- Restaurant can select an approved rider and dispatch from the order card.
- file: `app/restaurant/orders/page.tsx`

### Backend
- Wired dispatch form to assignment create flow:
  - `createDriverAssignment` integration with server action in restaurant orders page.
- Added dispatch success/error handling for:
  - invalid rider
  - rider not eligible
  - order already assigned
  - invalid assignment status

## Stage 6 - Rider Inbox
Status: Completed

### Frontend
- Upgraded rider dashboard to dedicated inbox sections:
  - Pending (with Accept/Reject actions)
  - Active
  - History
- Added status/error feedback banners for rider assignment actions.
- file: `app/driver/page.tsx`

### Backend
- Rider inbox now uses assignment data layer and driver action handlers for accept/reject.
- files:
  - `app/lib/db/driver-assignments.ts`
  - `app/lib/driver-actions.ts`

## Stage 7 - Rider Action Flow
Status: Completed

### Frontend
- Added rider action controls in Active deliveries:
  - `Mark picked up` for `DRIVER_ASSIGNED`
  - `Mark en route` for `PICKED_UP`
- file: `app/driver/page.tsx`

### Backend
- Added transition backend logic:
  - `updateDriverDeliveryStatus`
  - enforces assignment ownership, accepted state, and valid status transitions.
- file: `app/lib/db/driver-assignments.ts`
- Added server actions:
  - `markOrderPickedUp`
  - `markOrderEnRoute`
- file: `app/lib/driver-actions.ts`

## Stage 8 - Delivery Confirmation Code
Status: Completed

### Frontend
- Added 4-digit delivery code entry in Active deliveries for `EN_ROUTE` orders.
- Added user feedback banners for code/transition outcomes.
- file: `app/driver/page.tsx`

### Backend
- Added delivery code verification and completion flow:
  - `completeDriverDeliveryWithCode`
  - validates 4-digit code format
  - verifies code against order
  - transitions `EN_ROUTE -> DELIVERED`
- file: `app/lib/db/driver-assignments.ts`
- Added server action:
  - `confirmOrderDelivery`
- file: `app/lib/driver-actions.ts`

## Stage 9 - Customer and Restaurant Tracking Sync
Status: Completed

### Frontend
- Customer order details now show rider identity and status-aware delivery progress messaging.
- file: `app/customer/orders/[id]/page.tsx`
- Restaurant orders "Ready and Delivery" section now shows rider progress guidance for:
  - `DRIVER_ASSIGNED`
  - `PICKED_UP`
  - `EN_ROUTE`
- file: `app/restaurant/orders/page.tsx`

### Backend
- Customer order fetch now includes assignment driver identity for live tracking UI.
- file: `app/lib/db/orders.ts`

## Stage 10 - Payout Trigger Hooks
Status: Completed

### Backend
- On successful delivery confirmation (`EN_ROUTE -> DELIVERED`), payout ledger entries are created exactly once per recipient:
  - Restaurant payout entry (amount: `itemsSubtotal`)
  - Driver payout entry (amount: `deliveryFee`)
- file: `app/lib/db/driver-assignments.ts`

### Frontend
- Added rider payout panel in dashboard showing payout status and amount.
- file: `app/driver/page.tsx`

## Stage 11 - Hardening and Edge Cases
Status: Completed

### Backend
- Added DB-level uniqueness for payout ledger entries by recipient/order:
  - `@@unique([orderId, recipientType, recipientId])`
  - file: `prisma/schema.prisma`
  - migration: `prisma/migrations/20260214230000_payout_ledger_uniqueness/migration.sql`
- Added race-safe payout creation helper that tolerates unique conflicts during concurrent delivery completion:
  - file: `app/lib/db/driver-assignments.ts`

### Frontend + Workflow
- Enforced paid-only restaurant acceptance flow in Orders Hub:
  - `PLACED` orders can no longer be accepted/rejected
  - inline UI message now indicates waiting for payment
  - file: `app/restaurant/orders/page.tsx`

## Stage 12 - Rider UX Restructure and Dispatch Clarity
Status: Completed

### Frontend
- Split rider experience into dedicated pages (similar to restaurant structure):
  - Dashboard: `app/driver/page.tsx`
  - Assignments: `app/driver/assignments/page.tsx`
  - Payouts: `app/driver/payouts/page.tsx`
- Updated rider navigation to include:
  - Dashboard
  - Assignments
  - Payouts
  - file: `components/app/app-header.tsx`
- Moved assignment accept/reject and delivery flow controls into the Assignments page only.

### Backend + Flow
- Updated rider server action redirects to stay on Assignments page after actions:
  - file: `app/lib/driver-actions.ts`
- Clarified rider selection policy in restaurant dispatch UI:
  - Manual dispatch remains active
  - Eligible riders are listed by lowest assignment load first
  - file: `app/restaurant/orders/page.tsx`

## Stage 13 - Rider Profile Management
Status: Completed

### Frontend
- Added dedicated rider profile page:
  - `app/driver/profile/page.tsx`
- Rider can now edit:
  - full name
  - license number
  - vehicle type
  - plate number
  - service areas (multi-select checkboxes)
  - bank name, account number, account name
- Added rider nav entry for Profile:
  - `components/app/app-header.tsx`
- Added dashboard quick action linking to profile:
  - `app/driver/page.tsx`

### Backend
- Profile save action uses guarded rider session and updates both:
  - `User.fullName`
  - `DriverProfile` fields via `upsertDriverProfile`
- Validation added for required fields and valid service areas.
