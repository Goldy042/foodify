import "dotenv/config";
import { PrismaClient, Prisma } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString =
  process.env.DIRECT_URL || process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("Missing DIRECT_URL or DATABASE_URL for seeding.");
}

const adapter = new PrismaPg({
  connectionString,
});

const prisma = new PrismaClient({ adapter });

export async function main() {
  const restaurantUser = await prisma.user.create({
    data: {
      fullName: "Lagos Kitchen",
      email: "restaurant@foodify.test",
      passwordHash: "seeded",
      role: "RESTAURANT",
      status: "APPROVED",
      restaurantProfile: {
        create: {
          restaurantName: "Lagos Kitchen",
          logoUrl: "https://example.com/logo.png",
          phoneNumber: "+2347000000000",
          streetAddress: "12 Marina Road",
          area: "VICTORIA_ISLAND",
          addressLat: new Prisma.Decimal("6.4281"),
          addressLng: new Prisma.Decimal("3.4219"),
          cuisineTypes: ["NIGERIAN", "FAST_FOOD"],
          openTime: "09:00",
          closeTime: "20:00",
          daysOpen: ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"],
          prepTimeRange: "MINS_15_25",
          bankName: "GTBANK",
          accountNumber: "0123456789",
          accountName: "Lagos Kitchen",
        },
      },
    },
    include: {
      restaurantProfile: true,
    },
  });

  const restaurantProfileId = restaurantUser.restaurantProfile?.id;

  if (restaurantProfileId) {
    const category = await prisma.menuCategory.create({
      data: {
        restaurantId: restaurantProfileId,
        category: "RICE_DISHES",
      },
    });

    const item = await prisma.menuItem.create({
      data: {
        restaurantId: restaurantProfileId,
        categoryId: category.id,
        name: "Jollof Rice",
        description: "Smoky jollof rice with grilled chicken.",
        baseImageUrl: "https://example.com/jollof.png",
      },
    });

    await prisma.menuItemMeasurement.create({
      data: {
        menuItemId: item.id,
        unit: "PLATE",
        basePrice: new Prisma.Decimal("2500.00"),
      },
    });

    await prisma.modifierGroup.create({
      data: {
        menuItemId: item.id,
        name: "Protein",
        isRequired: true,
        maxSelections: 1,
        options: {
          create: [
            { name: "Chicken", priceDelta: new Prisma.Decimal("500.00") },
            { name: "Beef", priceDelta: new Prisma.Decimal("400.00") },
            { name: "Fish", priceDelta: new Prisma.Decimal("450.00") },
            { name: "Egg", priceDelta: new Prisma.Decimal("200.00") },
          ],
        },
      },
    });
  }

  await prisma.user.create({
    data: {
      fullName: "Ada Customer",
      email: "customer@foodify.test",
      passwordHash: "seeded",
      role: "CUSTOMER",
      status: "PROFILE_COMPLETED",
      customerProfile: {
        create: {
          defaultAddressText: "44 Bourdillon Road",
          defaultAddressLat: new Prisma.Decimal("6.4433"),
          defaultAddressLng: new Prisma.Decimal("3.4210"),
          deliveryInstructions: "Call on arrival.",
        },
      },
    },
  });

  await prisma.user.create({
    data: {
      fullName: "Tunde Rider",
      email: "driver@foodify.test",
      passwordHash: "seeded",
      role: "DRIVER",
      status: "APPROVED",
      driverProfile: {
        create: {
          licenseNumber: "DRV-12345",
          vehicleType: "BIKE",
          plateNumber: "KJA-123AB",
          serviceAreas: ["LEKKI", "VICTORIA_ISLAND"],
          bankName: "UBA",
          accountNumber: "1234567890",
          accountName: "Tunde Rider",
        },
      },
    },
  });
}

main()
  .catch(async (error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
