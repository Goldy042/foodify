import prisma from "@/lib/prisma";
import {
  Area,
  CuisineType,
  PrepTimeRange,
} from "@/app/generated/prisma/client";

type RestaurantFilters = {
  area?: Area;
  prepTimeRange?: PrepTimeRange;
  cuisineTypes?: CuisineType[];
};

export async function listApprovedRestaurants(filters: RestaurantFilters = {}) {
  const { area, prepTimeRange, cuisineTypes } = filters;
  console.log("Listing restaurants with filters:", { area, prepTimeRange, cuisineTypes });

  return prisma.restaurantProfile.findMany({
    where: {
      user: {
        status: "APPROVED",
        isSuspended: false,
      },
      ...(area ? { area } : {}),
      ...(prepTimeRange ? { prepTimeRange } : {}),
      ...(cuisineTypes && cuisineTypes.length > 0
        ? { cuisineTypes: { hasSome: cuisineTypes } }
        : {}),
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getApprovedRestaurantById(id: string) {
  return prisma.restaurantProfile.findFirst({
    where: {
      id,
      user: {
        status: "APPROVED",
        isSuspended: false,
      },
    },
    include: {
      menuCategories: {
        orderBy: { createdAt: "asc" },
        include: {
          items: {
            orderBy: { createdAt: "asc" },
            include: {
              measurements: { orderBy: { createdAt: "asc" } },
              modifierGroups: {
                orderBy: { createdAt: "asc" },
                include: { options: { orderBy: { priceDelta: "asc" } } },
              },
            },
          },
        },
      },
    },
  });
}
