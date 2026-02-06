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
  query?: string;
};

export async function listApprovedRestaurants(filters: RestaurantFilters = {}) {
  const { area, prepTimeRange, cuisineTypes, query } = filters;
  const trimmedQuery = query?.trim();
  console.log("Listing restaurants with filters:", {
    area,
    prepTimeRange,
    cuisineTypes,
    query: trimmedQuery,
  });

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
      ...(trimmedQuery
        ? {
            OR: [
              { restaurantName: { contains: trimmedQuery, mode: "insensitive" } },
              { city: { contains: trimmedQuery, mode: "insensitive" } },
              { streetAddress: { contains: trimmedQuery, mode: "insensitive" } },
            ],
          }
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
