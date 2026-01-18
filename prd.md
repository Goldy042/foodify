# Foodify PRD - Full Workflow (Strict, Closed-Ended)

## Summary
Foodify is a multi-role delivery platform with four fixed roles: Customer, Restaurant, Driver, Admin. Each account maps to exactly one role. Signup is shared across roles and gated by email verification and mandatory profile completion. Restaurants and drivers require admin approval before becoming active. Orders follow a strict status flow with escrow-based payouts and a delivery confirmation code.

## Goals
- Enforce a closed-ended workflow with fixed fields, options, and statuses.
- Ensure role-specific onboarding with explicit approval gates.
- Deliver a reliable order lifecycle with payment, dispatch, delivery confirmation, and escrow payouts.
- Provide admin oversight for approvals, disputes, status overrides, refunds, and payouts.

## Non-goals
- Role switching or multi-role accounts.
- Free-text categories for areas, cuisine types, or measurement units.
- Automated driver dispatch (manual assignment only for MVP).
- Restaurant discovery or personalization beyond core filters.

## UI/UX Requirements
- Use shadcn/ui components for all UI primitives (forms, buttons, cards, alerts).
- Clean, modern, minimal layout with consistent spacing and hierarchy.
- Form layouts use clear labels, grouped sections, and predictable placement.
- White space and 8pt spacing rhythm across pages.
- Typography:
  - Display: Fraunces (headlines).
  - Body: Space Grotesk (primary text and UI).
- Theme direction: Warm stone neutrals with a paprika primary accent and a soft mint accent for secondary highlights.

## Implementation Plan
Phase 1: Foundation
- Define enums and constants for roles, statuses, areas, cuisines, measurements, and bank list.
- Create core data model and migrations.
- Add email verification token flow.

Phase 2: Auth + Profile Gating
- Shared signup with role selection (Customer, Restaurant, Driver only).
- Email verification and status gating.
- Role-specific profile completion screens and validations.

Phase 3: Restaurant + Driver Approvals
- Admin review screens for Restaurant and Driver.
- Approval and rejection with reason.
- Activation gate that hides non-approved accounts from customers.

Phase 4: Menu System
- Menu categories, items, measurements, modifiers.
- Availability toggle and validation rules (at least one measurement).

Phase 5: Orders + Payments
- Order creation, pricing calculation, payment integration.
- Order status transitions and audit trail.

Phase 6: Dispatch + Delivery Confirmation
- Manual admin driver assignment and driver acceptance flow.
- Pickup, en route, and delivery confirmation code entry.

Phase 7: Payouts + Admin Ops
- Escrow payout timing, ledger entries, and release flows.
- Admin overrides and refunds.

## Roles and Access Rules
- Customer: places orders, tracks delivery, confirms delivery code.
- Restaurant: manages menu and order fulfillment after approval.
- Driver: fulfills deliveries after approval.
- Admin: platform oversight and approvals.
- One account equals one role. No role switching.
- Admin accounts are created internally and not via signup.

## Global Status Rules
- Signup creates account with status = EMAIL_UNVERIFIED.
- Email verification sets status = EMAIL_VERIFIED.
- All users must complete profile before dashboard access.
- Profile completion sets status = PROFILE_COMPLETED.
- Restaurant and Driver then move to PENDING_APPROVAL.
- Admin approval sets status = APPROVED or REJECTED.

## Authentication Flow (All Users)
Signup fields:
- Full name (text)
- Email (unique)
- Password (hashed)
- Role (radio select): Customer / Restaurant / Driver

Email verification:
- Single-use token link
- Validate token
- Set status to EMAIL_VERIFIED
- Redirect to Complete Profile page
- No dashboard access until profile is completed
- Email provider: Resend

## Customer Workflow (Email Only)
Profile completion fields:
- Full name (prefilled, editable)
- Email (read-only)
- Default delivery address (text)
- Address map pin (lat/lng required)
- Delivery instructions (optional)

Status after completion:
- PROFILE_COMPLETED
- Account active immediately (no approval)

Customer capabilities:
- Browse restaurants
- View menus
- Place orders
- Pay for orders
- Track delivery
- Enter delivery confirmation code

## Restaurant Workflow (Strict)
Profile completion fields (no free-text guessing):

Restaurant identity:
- Restaurant name (text)
- Restaurant logo (image)
- Restaurant phone number (text)

Location:
- Street address (text)
- Area / Neighborhood (select): Lekki, Ajah, Yaba, Surulere, Ikeja, Victoria Island, Ikoyi
- City (fixed): Lagos
- Map pin (lat/lng required)

Cuisine type (multi-select only):
- Nigerian
- Fast Food
- Continental
- Chinese
- Pizza
- Burgers
- Shawarma
- Grill / Barbecue
- Seafood
- Vegetarian
- Desserts
- Drinks & Beverages

Operating hours (fixed format):
- Open time (HH:MM)
- Close time (HH:MM)
- Days open (checkbox): Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday

Preparation time (select):
- 10-15 mins
- 15-25 mins
- 25-40 mins
- 40-60 mins

Payout details:
- Bank name (select from Nigerian banks)
- Account number
- Account name (auto-resolved via API)

Status after completion:
- PROFILE_COMPLETED
- PENDING_APPROVAL (restaurant is not live)

Admin approval (restaurant):
- Checks: profile completeness, logo present, address pinned, bank details valid
- Actions: Approve -> status = APPROVED; Reject -> status = REJECTED (with reason)
- Only APPROVED restaurants appear to customers

## Menu System
Menu category (select or create):
- Rice Dishes
- Swallow & Soup
- Pasta
- Grills
- Snacks
- Drinks
- Desserts
- Combos

Menu item creation fields:
- Item name
- Category (select)
- Description (optional)
- Base image
- Is available (toggle)
- Measurement units (select only)

Measurement units (at least one):
- Plate
- Half Plate
- Bowl
- 1kg
- 2kg
- 50cl
- 60cl
- 1L

Each measurement includes:
- Base price
- Prep time override (optional)

Variations / modifiers (structured):
- Modifier group has: Required (yes/no), Max selections (1 or more)
- Examples:
  - Protein (required): Chicken (+NGN 500), Beef (+NGN 400), Fish (+NGN 600)
  - Drink (optional): 50cl Coke (+NGN 300), 60cl Fanta (+NGN 300), Water (+NGN 200)

## Driver Workflow
Profile completion fields:
- Full name (prefilled)
- Email (read-only)
- Driver license number
- Vehicle type (select): Bike, Car
- Plate number
- Service areas (multi-select): Lekki, Ajah, Yaba, Surulere, Ikeja, Victoria Island, Ikoyi
- Bank account details (same as restaurant)

Status after completion:
- PROFILE_COMPLETED
- PENDING_APPROVAL

Admin approval (driver):
- Checks: license number present, plate number present, bank details valid
- Approve -> status = APPROVED (driver can go online)

## Order Flow (Core Logic)
Order creation (customer):
- Select restaurant
- Select items, measurement, variations
- Set delivery address

System calculates:
- Items subtotal
- Delivery fee
- Service fee
- Total

Order status:
- PLACED

Payment:
- Payment success -> PAID
- Payment failure -> FAILED_PAYMENT

## Restaurant Order Flow
- Accept -> ACCEPTED
- Reject -> REJECTED
- If accepted: PREPARING -> READY_FOR_PICKUP

## Driver Dispatch (Manual MVP)
- Admin assigns driver
- Driver notified
- Driver accepts -> DRIVER_ASSIGNED
- Pickup confirmed -> PICKED_UP
- En route -> EN_ROUTE

## Delivery Confirmation (Anti-fraud)
- System generates 4-digit code
- Customer gives code to driver
- Driver enters code
- Status -> DELIVERED
- Delivery confirmation unlocks payouts

## Payouts (Escrow Model)
Restaurant payout:
- Triggered when order = DELIVERED
- No dispute within X hours

Driver payout:
- Triggered when delivery confirmed

Foodify keeps:
- Commission
- Service fees

All payouts logged in a ledger.

## Admin Powers (Mandatory)
- Approve / suspend restaurants
- Approve / suspend drivers
- Override order statuses
- Trigger refunds
- Manually release payouts

## Preliminary Data Model
User
- id, full_name, email (unique), password_hash, role
- account_status: EMAIL_UNVERIFIED, EMAIL_VERIFIED, PROFILE_COMPLETED, PENDING_APPROVAL, APPROVED, REJECTED
- is_suspended (boolean)
- created_at, updated_at

VerificationToken
- id, user_id, token, expires_at, used_at

CustomerProfile
- id, user_id
- default_address_text, default_address_lat, default_address_lng
- delivery_instructions (nullable)

RestaurantProfile
- id, user_id
- restaurant_name, logo_url, phone_number
- street_address, area, city (fixed: Lagos)
- address_lat, address_lng
- cuisine_types (array)
- open_time, close_time, days_open (array)
- prep_time_range
- bank_account_id

DriverProfile
- id, user_id
- license_number, vehicle_type, plate_number
- service_areas (array)
- bank_account_id

BankAccount
- id, bank_name, account_number, account_name, verified_at

MenuCategory
- id, restaurant_id, name (limited to allowed categories)

MenuItem
- id, restaurant_id, category_id
- name, description (nullable), base_image_url
- is_available (boolean)

MenuItemMeasurement
- id, menu_item_id
- unit (enum), base_price, prep_time_override (nullable)

ModifierGroup
- id, menu_item_id
- name, is_required (boolean), max_selections (int)

ModifierOption
- id, modifier_group_id
- name, price_delta

Order
- id, customer_id, restaurant_id, driver_id (nullable)
- delivery_address_text, delivery_lat, delivery_lng
- items_subtotal, delivery_fee, service_fee, total
- status (enum: PLACED, PAID, FAILED_PAYMENT, ACCEPTED, REJECTED, PREPARING, READY_FOR_PICKUP, DRIVER_ASSIGNED, PICKED_UP, EN_ROUTE, DELIVERED)
- delivery_confirmation_code (4 digits)
- created_at, updated_at

OrderItem
- id, order_id, menu_item_id, measurement_unit
- quantity, unit_price, line_total

OrderItemModifierSelection
- id, order_item_id, modifier_option_id, price_delta

Payment
- id, order_id, provider_reference, status (SUCCESS, FAILED), amount
- created_at

DriverAssignment
- id, order_id, driver_id, accepted_at, rejected_at

PayoutLedgerEntry
- id, order_id, recipient_type (Restaurant or Driver), recipient_id
- amount, hold_until, released_at, released_by_admin_id

Refund
- id, order_id, amount, reason, refunded_at, refunded_by_admin_id

## Acceptance Criteria
Authentication
- Signup rejects duplicate email and non-allowed roles.
- Email verification link is single-use and expires.
- Users without PROFILE_COMPLETED cannot access dashboards.

Customer
- Profile completion requires address text and valid lat/lng.
- Customer is active immediately after PROFILE_COMPLETED.
- Customer can place orders without admin approval.

Restaurant
- Profile completion requires all listed fields and map pin.
- Cuisine type, area, and prep time are constrained to allowed lists.
- Restaurants are hidden from customers until APPROVED.
- Rejection requires a reason and status is REJECTED.

Menu
- Menu category is limited to allowed categories.
- Menu item requires at least one measurement unit.
- Modifier groups enforce required flag and max selections.

Driver
- Profile completion requires license number and plate number.
- Vehicle type and service areas are constrained to allowed lists.
- Driver is not assignable until APPROVED.

Orders + Payments
- Order cannot move to ACCEPTED unless status is PAID.
- Payment failure sets status to FAILED_PAYMENT.
- All fees and totals are stored per order at creation time.

Dispatch + Delivery
- Admin must assign driver to move to DRIVER_ASSIGNED.
- Driver confirmation updates status to PICKED_UP and EN_ROUTE.
- Delivery confirmation requires correct 4-digit code and sets DELIVERED.

Payouts
- Restaurant payout is held until order is DELIVERED and dispute window passes.
- Driver payout is released after delivery confirmation.
- All payouts are recorded in the ledger.

Admin
- Admin can override order statuses and log the action.
- Admin can suspend restaurants and drivers, preventing visibility/assignment.

## Open Questions
- What payment provider should we use for card/bank transfers?
- Which bank-account verification API should resolve account names?
- What is the dispute window duration for payouts (X hours)?
- How do we calculate delivery fee and service fee (flat, distance-based, or tiered)?
- Should refunds be full, partial, or configurable per case?
- Is Lagos-only fixed for MVP, or should we plan for expansion?
