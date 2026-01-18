-- CreateEnum
CREATE TYPE "Role" AS ENUM ('CUSTOMER', 'RESTAURANT', 'DRIVER', 'ADMIN');

-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('EMAIL_UNVERIFIED', 'EMAIL_VERIFIED', 'PROFILE_COMPLETED', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "Area" AS ENUM ('LEKKI', 'AJAH', 'YABA', 'SURULERE', 'IKEJA', 'VICTORIA_ISLAND', 'IKOYI');

-- CreateEnum
CREATE TYPE "CuisineType" AS ENUM ('NIGERIAN', 'FAST_FOOD', 'CONTINENTAL', 'CHINESE', 'PIZZA', 'BURGERS', 'SHAWARMA', 'GRILL_BARBECUE', 'SEAFOOD', 'VEGETARIAN', 'DESSERTS', 'DRINKS_BEVERAGES');

-- CreateEnum
CREATE TYPE "DayOfWeek" AS ENUM ('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY');

-- CreateEnum
CREATE TYPE "PrepTimeRange" AS ENUM ('MINS_10_15', 'MINS_15_25', 'MINS_25_40', 'MINS_40_60');

-- CreateEnum
CREATE TYPE "BankName" AS ENUM ('ACCESS_BANK', 'CITIBANK', 'ECOBANK', 'FIDELITY_BANK', 'FIRST_BANK', 'FCMB', 'GLOBUS_BANK', 'GTBANK', 'HERITAGE_BANK', 'JAIZ_BANK', 'KEYSTONE_BANK', 'KUDA', 'LOTUS_BANK', 'MONIEPOINT', 'OPAY', 'POLARIS_BANK', 'PROVIDUS_BANK', 'STANBIC_IBTC', 'STERLING_BANK', 'SUNTRUST_BANK', 'TITAN_TRUST_BANK', 'UBA', 'UNION_BANK', 'UNITY_BANK', 'WEMA_BANK', 'ZENITH_BANK');

-- CreateEnum
CREATE TYPE "MenuCategoryType" AS ENUM ('RICE_DISHES', 'SWALLOW_SOUP', 'PASTA', 'GRILLS', 'SNACKS', 'DRINKS', 'DESSERTS', 'COMBOS');

-- CreateEnum
CREATE TYPE "MeasurementUnit" AS ENUM ('PLATE', 'HALF_PLATE', 'BOWL', 'KG_1', 'KG_2', 'CL_50', 'CL_60', 'L_1');

-- CreateEnum
CREATE TYPE "VehicleType" AS ENUM ('BIKE', 'CAR');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PLACED', 'PAID', 'FAILED_PAYMENT', 'ACCEPTED', 'REJECTED', 'PREPARING', 'READY_FOR_PICKUP', 'DRIVER_ASSIGNED', 'PICKED_UP', 'EN_ROUTE', 'DELIVERED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED');

-- CreateEnum
CREATE TYPE "PayoutRecipientType" AS ENUM ('RESTAURANT', 'DRIVER');

-- CreateEnum
CREATE TYPE "PayoutStatus" AS ENUM ('HELD', 'RELEASED', 'REVERSED');

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "status" "AccountStatus" NOT NULL DEFAULT 'EMAIL_UNVERIFIED',
    "isSuspended" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),

    CONSTRAINT "VerificationToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerProfile" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "defaultAddressText" TEXT NOT NULL,
    "defaultAddressLat" DECIMAL(10,6) NOT NULL,
    "defaultAddressLng" DECIMAL(10,6) NOT NULL,
    "deliveryInstructions" TEXT,

    CONSTRAINT "CustomerProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RestaurantProfile" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "restaurantName" TEXT NOT NULL,
    "logoUrl" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "streetAddress" TEXT NOT NULL,
    "area" "Area" NOT NULL,
    "city" TEXT NOT NULL DEFAULT 'Lagos',
    "addressLat" DECIMAL(10,6) NOT NULL,
    "addressLng" DECIMAL(10,6) NOT NULL,
    "cuisineTypes" "CuisineType"[],
    "openTime" TEXT NOT NULL,
    "closeTime" TEXT NOT NULL,
    "daysOpen" "DayOfWeek"[],
    "prepTimeRange" "PrepTimeRange" NOT NULL,
    "bankName" "BankName" NOT NULL,
    "accountNumber" TEXT NOT NULL,
    "accountName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RestaurantProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DriverProfile" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "licenseNumber" TEXT NOT NULL,
    "vehicleType" "VehicleType" NOT NULL,
    "plateNumber" TEXT NOT NULL,
    "serviceAreas" "Area"[],
    "bankName" "BankName" NOT NULL,
    "accountNumber" TEXT NOT NULL,
    "accountName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DriverProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MenuCategory" (
    "id" UUID NOT NULL,
    "restaurantId" UUID NOT NULL,
    "category" "MenuCategoryType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MenuCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MenuItem" (
    "id" UUID NOT NULL,
    "restaurantId" UUID NOT NULL,
    "categoryId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "baseImageUrl" TEXT NOT NULL,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MenuItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MenuItemMeasurement" (
    "id" UUID NOT NULL,
    "menuItemId" UUID NOT NULL,
    "unit" "MeasurementUnit" NOT NULL,
    "basePrice" DECIMAL(10,2) NOT NULL,
    "prepTimeOverride" "PrepTimeRange",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MenuItemMeasurement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModifierGroup" (
    "id" UUID NOT NULL,
    "menuItemId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "maxSelections" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ModifierGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModifierOption" (
    "id" UUID NOT NULL,
    "modifierGroupId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "priceDelta" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "ModifierOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" UUID NOT NULL,
    "customerId" UUID NOT NULL,
    "restaurantId" UUID NOT NULL,
    "driverId" UUID,
    "deliveryAddressText" TEXT NOT NULL,
    "deliveryLat" DECIMAL(10,6) NOT NULL,
    "deliveryLng" DECIMAL(10,6) NOT NULL,
    "itemsSubtotal" DECIMAL(10,2) NOT NULL,
    "deliveryFee" DECIMAL(10,2) NOT NULL,
    "serviceFee" DECIMAL(10,2) NOT NULL,
    "total" DECIMAL(10,2) NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'PLACED',
    "deliveryConfirmationCode" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderItem" (
    "id" UUID NOT NULL,
    "orderId" UUID NOT NULL,
    "menuItemId" UUID NOT NULL,
    "measurementUnit" "MeasurementUnit" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DECIMAL(10,2) NOT NULL,
    "lineTotal" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderItemModifierSelection" (
    "id" UUID NOT NULL,
    "orderItemId" UUID NOT NULL,
    "modifierOptionId" UUID NOT NULL,
    "priceDelta" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "OrderItemModifierSelection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" UUID NOT NULL,
    "orderId" UUID NOT NULL,
    "provider" TEXT NOT NULL,
    "providerReference" TEXT NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "amount" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DriverAssignment" (
    "id" UUID NOT NULL,
    "orderId" UUID NOT NULL,
    "driverId" UUID NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acceptedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),

    CONSTRAINT "DriverAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayoutLedgerEntry" (
    "id" UUID NOT NULL,
    "orderId" UUID NOT NULL,
    "recipientType" "PayoutRecipientType" NOT NULL,
    "recipientId" UUID NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "status" "PayoutStatus" NOT NULL DEFAULT 'HELD',
    "holdUntil" TIMESTAMP(3),
    "releasedAt" TIMESTAMP(3),
    "releasedByAdminId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PayoutLedgerEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Refund" (
    "id" UUID NOT NULL,
    "orderId" UUID NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "reason" TEXT NOT NULL,
    "refundedAt" TIMESTAMP(3),
    "refundedByAdminId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Refund_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "Session_token_key" ON "Session"("token");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerProfile_userId_key" ON "CustomerProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "RestaurantProfile_userId_key" ON "RestaurantProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "DriverProfile_userId_key" ON "DriverProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_orderId_key" ON "Payment"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "DriverAssignment_orderId_key" ON "DriverAssignment"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "Refund_orderId_key" ON "Refund"("orderId");

-- AddForeignKey
ALTER TABLE "VerificationToken" ADD CONSTRAINT "VerificationToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerProfile" ADD CONSTRAINT "CustomerProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RestaurantProfile" ADD CONSTRAINT "RestaurantProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverProfile" ADD CONSTRAINT "DriverProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MenuCategory" ADD CONSTRAINT "MenuCategory_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "RestaurantProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MenuItem" ADD CONSTRAINT "MenuItem_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "RestaurantProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MenuItem" ADD CONSTRAINT "MenuItem_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "MenuCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MenuItemMeasurement" ADD CONSTRAINT "MenuItemMeasurement_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "MenuItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModifierGroup" ADD CONSTRAINT "ModifierGroup_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "MenuItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModifierOption" ADD CONSTRAINT "ModifierOption_modifierGroupId_fkey" FOREIGN KEY ("modifierGroupId") REFERENCES "ModifierGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "RestaurantProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "MenuItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItemModifierSelection" ADD CONSTRAINT "OrderItemModifierSelection_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "OrderItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItemModifierSelection" ADD CONSTRAINT "OrderItemModifierSelection_modifierOptionId_fkey" FOREIGN KEY ("modifierOptionId") REFERENCES "ModifierOption"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverAssignment" ADD CONSTRAINT "DriverAssignment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverAssignment" ADD CONSTRAINT "DriverAssignment_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayoutLedgerEntry" ADD CONSTRAINT "PayoutLedgerEntry_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayoutLedgerEntry" ADD CONSTRAINT "PayoutLedgerEntry_releasedByAdminId_fkey" FOREIGN KEY ("releasedByAdminId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Refund" ADD CONSTRAINT "Refund_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Refund" ADD CONSTRAINT "Refund_refundedByAdminId_fkey" FOREIGN KEY ("refundedByAdminId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
