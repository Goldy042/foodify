-- Restaurant workspace staff management support.

CREATE TYPE "RestaurantStaffRole" AS ENUM ('MANAGER', 'SUPERVISOR', 'KITCHEN', 'CASHIER');

CREATE TYPE "RestaurantStaffStatus" AS ENUM ('INVITED', 'ACTIVE', 'DISABLED');

CREATE TABLE "RestaurantStaffMember" (
    "id" UUID NOT NULL,
    "restaurantId" UUID NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "RestaurantStaffRole" NOT NULL,
    "status" "RestaurantStaffStatus" NOT NULL DEFAULT 'INVITED',
    "invitedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "RestaurantStaffMember_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "RestaurantStaffMember_restaurantId_email_key"
ON "RestaurantStaffMember"("restaurantId", "email");

CREATE INDEX "RestaurantStaffMember_restaurantId_status_idx"
ON "RestaurantStaffMember"("restaurantId", "status");

ALTER TABLE "RestaurantStaffMember"
ADD CONSTRAINT "RestaurantStaffMember_restaurantId_fkey"
FOREIGN KEY ("restaurantId") REFERENCES "RestaurantProfile"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
