# Restaurant Update (Tasks 4-6 Handoff)

## Task 4: Orders Hub (Completed)

### Delivered
- Built production-like orders hub at `app/restaurant/orders/page.tsx`.
- Implemented queue lanes:
  - Inbox: `PLACED`, `PAID`
  - Kitchen: `ACCEPTED`, `PREPARING`
  - Ready/Delivery: `READY_FOR_PICKUP`, `DRIVER_ASSIGNED`, `PICKED_UP`, `EN_ROUTE`
  - Closed: `DELIVERED`, `REJECTED`, `FAILED_PAYMENT`
- Added server-side transition rules:
  - `PLACED|PAID -> ACCEPTED|REJECTED`
  - `ACCEPTED -> PREPARING`
  - `PREPARING -> READY_FOR_PICKUP`
- Added queue KPI counts and success/error alerts.

### Remaining polish (optional)
- Add transition history timeline per order.
- Add search/filter by order id, customer, and channel.
- Add pagination/virtualization for high order volume.

## Task 5: Staff Workspace (Completed)

### Delivered
- Replaced placeholder staff page with a full workspace at `app/restaurant/staff/page.tsx`.
- Added in-page invite flow with server-side validation for name, email format, role, and duplicate staff email.
- Added role update and status update server actions with strict same-restaurant ownership checks.
- Added guarded status transitions: `INVITED -> ACTIVE|DISABLED`, `ACTIVE -> DISABLED`, `DISABLED -> ACTIVE`.
- Added role/status quick filters and roster cards with role/status badges.
- Added activity counters for total, active, invited, and disabled staff.

### Suggested files
- `app/restaurant/staff/page.tsx`
- `app/restaurant/_lib/guards.ts` (reuse for auth/restaurant checks)
- `app/lib/db/...` for staff queries/actions if extraction is needed

### Acceptance criteria
- Restaurant manager can invite and manage staff end-to-end in `/restaurant/staff`.
- All writes are restaurant-scoped and permission-checked server-side.
- No dependency on legacy `/restaurant/workspace` for staff operations.

## Task 6: Customer/Restaurant Alignment (Completed)

### Delivered
- Built complete `/restaurant/settings` editor with server-side save action in `app/restaurant/settings/page.tsx`.
- Added profile completeness checklist and score (logo, hours, address, cuisines, contact).
- Added restaurant warnings for:
  - no sellable menu items
  - missing critical profile info
  - items without valid measurement pricing
- Added storefront consistency guardrails in `app/lib/db/restaurants.ts`:
  - sellable item filter requires `isAvailable = true` and at least one measurement with `basePrice > 0`
  - same sellable filter used for listing search previews and restaurant detail menu hydration
- Updated customer restaurant detail in `app/restaurants/[id]/page.tsx` to render only sellable items/categories.
- Updated customer listing count in `app/restaurants/page.tsx` to display sellable dish counts.
- Updated restaurant dashboard warnings and menu coverage metric in `app/restaurant/page.tsx` to use sellable item logic.

### Suggested files
- `app/restaurant/settings/page.tsx`
- `app/restaurants/[id]/page.tsx`
- `app/lib/db/restaurants.ts`

### Acceptance criteria
- Restaurant can fully manage profile/menu quality from dedicated pages.
- Customer storefront reflects updates without stale or conflicting logic.
- Legacy workspace becomes optional and can be retired.

## Confirmed architecture and envs (already fixed)
- Menu image upload is server-side via `POST /api/cloudinary/menu-upload`.
- Form submits only `itemImageUrl` to server actions (no large file body payload).
- Required env vars:
  - `CLOUDINARY_CLOUD_NAME`
  - `CLOUDINARY_API_KEY`
  - `CLOUDINARY_API_SECRET`

## Fresh chat starter prompt
Use this in the next chat:
"Continue Foodify post-Task-6 polish from `resturant_update.md`: add tests for sellable menu filtering and settings validation, then remove remaining optional legacy workspace references."
