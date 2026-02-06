import prisma from "@/lib/prisma";
import {
  Area,
  BankName,
  CuisineType,
  DayOfWeek,
  PrepTimeRange,
  VehicleType,
} from "@/app/generated/prisma/client";

export async function getCustomerProfile(userId: string) {
  return prisma.customerProfile.findUnique({ where: { userId } });
}

export async function getRestaurantProfile(userId: string) {
  return prisma.restaurantProfile.findUnique({ where: { userId } });
}

export async function getDriverProfile(userId: string) {
  return prisma.driverProfile.findUnique({ where: { userId } });
}

export async function upsertCustomerProfile(
  userId: string,
  data: {
    defaultAddressText: string;
    defaultAddressLat: number;
    defaultAddressLng: number;
    deliveryInstructions: string | null;
  }
) {
  return prisma.customerProfile.upsert({
    where: { userId },
    update: data,
    create: { userId, ...data },
  });
}

export async function upsertRestaurantProfile(
  userId: string,
  data: {
    restaurantName: string;
    logoUrl: string;
    phoneNumber: string;
    streetAddress: string;
    area: Area;
    city: string;
    addressLat: number;
    addressLng: number;
    cuisineTypes: CuisineType[];
    openTime: string;
    closeTime: string;
    daysOpen: DayOfWeek[];
    prepTimeRange: PrepTimeRange;
    bankName: BankName;
    accountNumber: string;
    accountName: string;
  }
) {
  return prisma.restaurantProfile.upsert({
    where: { userId },
    update: data,
    create: { userId, ...data },
  });
}

export async function upsertDriverProfile(
  userId: string,
  data: {
    licenseNumber: string;
    vehicleType: VehicleType;
    plateNumber: string;
    serviceAreas: Area[];
    bankName: BankName;
    accountNumber: string;
    accountName: string;
  }
) {
  return prisma.driverProfile.upsert({
    where: { userId },
    update: data,
    create: { userId, ...data },
  });
}
