# Foodify Progress Report

## Summary
We established the initial product workflow, built the first onboarding UI flows with shadcn/ui, and started the database layer with Prisma using the Accelerate + Direct URL model.

## What We Completed
- PRD finalized with strict workflow, UI/UX rules, and Resend email provider: `prd.md`
- Design system and shadcn/ui setup for consistent UI primitives and spacing
- Signup UI and email verification UI with Resend integration
- Role-specific onboarding screens:
  - Customer profile completion
  - Restaurant profile completion with approval gate
  - Driver profile completion with approval gate
- Server-side auth flow with verification tokens and session cookies
- Prisma schema aligned with Foodify roles, menus, orders, payouts
- Prisma config (`prisma.config.ts`) with dotenv and seed hook
- Seed script for sample customer, restaurant, driver, and a menu item
- Seeded a menu modifier group for Protein (Chicken, Beef, Fish, Egg)

## What Is Left To Do (Core)
- Migrate auth and onboarding from JSON store to Prisma client
- Implement login and session refresh (or leverage the current cookie/session flow)
- Build restaurant dashboard (menu CRUD, orders)
- Add modifier groups/options in menu CRUD (Protein single-select)
- Build customer ordering flow (cart, payment)
- Build driver assignment flow (manual dispatch)
- Build admin approval workflows for restaurants and drivers
- Implement payout ledger and dispute window logic
- Add tests for status transitions and form validation

## Strict Rules To Follow
- Roles are fixed: Customer, Restaurant, Driver, Admin. No role switching.
- Signup only allows Customer, Restaurant, Driver. Admin is internal only.
- All fields marked as closed-ended must remain closed-ended (no free text).
- Restaurants and drivers must be APPROVED before becoming live.
- No dashboard access until profile completion.
- Delivery confirmation code is mandatory for payouts.
- Use Resend for email verification.
- Use Prisma Accelerate URL in `DATABASE_URL` and direct Postgres in `DIRECT_URL`.

## UI/UX Rules
- Use shadcn/ui for all standard UI primitives (forms, modals, dialogs, alerts).
- Do not create custom modals unless shadcn/ui cannot support the need.
- Keep layouts clean, modern, and consistent with spacing and hierarchy.
- Maintain the typography rules in `prd.md`.

## References
- Product spec: `prd.md`
- Prisma config: `prisma.config.ts`
- Prisma schema: `prisma/schema.prisma`
