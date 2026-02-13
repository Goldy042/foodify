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
    const riceCategory = await prisma.menuCategory.create({
      data: {
        restaurantId: restaurantProfileId,
        category: "RICE_DISHES",
      },
    });

    const jollofItem = await prisma.menuItem.create({
      data: {
        restaurantId: restaurantProfileId,
        categoryId: riceCategory.id,
        name: "Jollof Rice",
        description: "Smoky jollof rice with grilled chicken.",
        baseImageUrl: "https://example.com/jollof.png",
      },
    });

    await prisma.menuItemMeasurement.create({
      data: {
        menuItemId: jollofItem.id,
        unit: "PLATE",
        basePrice: new Prisma.Decimal("2500.00"),
      },
    });

    await prisma.modifierGroup.create({
      data: {
        menuItemId: jollofItem.id,
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

    const swallowCategory = await prisma.menuCategory.create({
      data: {
        restaurantId: restaurantProfileId,
        category: "SWALLOW_SOUP",
      },
    });

    const egusiItem = await prisma.menuItem.create({
      data: {
        restaurantId: restaurantProfileId,
        categoryId: swallowCategory.id,
        name: "Egusi Soup + Fufu",
        description:
          "500g egusi soup with default 2 wraps of fufu. Add wraps, protein, and drinks.",
        baseImageUrl: "https://example.com/egusi.png",
      },
    });

    await prisma.menuItemMeasurement.create({
      data: {
        menuItemId: egusiItem.id,
        unit: "BOWL",
        basePrice: new Prisma.Decimal("3800.00"),
      },
    });

    await prisma.modifierGroup.create({
      data: {
        menuItemId: egusiItem.id,
        name: "Fufu Wraps",
        isRequired: true,
        maxSelections: 1,
        options: {
          create: [
            {
              name: "Fufu",
              priceDelta: new Prisma.Decimal("350.00"),
              maxQuantity: 6,
              includedQuantity: 2,
              defaultQuantity: 2,
            },
          ],
        },
      },
    });

    await prisma.modifierGroup.create({
      data: {
        menuItemId: egusiItem.id,
        name: "Protein Add-on",
        isRequired: false,
        maxSelections: 2,
        options: {
          create: [
            {
              name: "Beef",
              priceDelta: new Prisma.Decimal("600.00"),
              maxQuantity: 3,
            },
            {
              name: "Goat meat",
              priceDelta: new Prisma.Decimal("750.00"),
              maxQuantity: 2,
            },
            {
              name: "Fish",
              priceDelta: new Prisma.Decimal("700.00"),
              maxQuantity: 2,
            },
          ],
        },
      },
    });

    await prisma.modifierGroup.create({
      data: {
        menuItemId: egusiItem.id,
        name: "Drink",
        isRequired: false,
        maxSelections: 1,
        options: {
          create: [
            {
              name: "Malt",
              priceDelta: new Prisma.Decimal("300.00"),
              maxQuantity: 1,
              defaultQuantity: 1,
            },
            {
              name: "Water",
              priceDelta: new Prisma.Decimal("0.00"),
              maxQuantity: 1,
            },
            {
              name: "Coke",
              priceDelta: new Prisma.Decimal("250.00"),
              maxQuantity: 1,
            },
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
