import prisma from "@/lib/prisma";
import {
  Prisma,
  Area,
  CuisineType,
  PrepTimeRange,
} from "@/app/generated/prisma/client";
import { cuisineEnumToLabel } from "./mappers";
import {
  calculateDistanceKm,
  DEFAULT_SERVICE_RADIUS_KM,
  getLagosOpenNowContext,
  isOpenAtTime,
} from "@/app/lib/restaurant-availability";

export type RestaurantSortBy = "recommended" | "prep" | "newest";

type RestaurantFilters = {
  area?: Area;
  prepTimeRange?: PrepTimeRange;
  cuisineTypes?: CuisineType[];
  search?: string;
  openNow?: boolean;
  customerLat?: number;
  customerLng?: number;
  maxDistanceKm?: number;
  sortBy?: RestaurantSortBy;
  page?: number;
  pageSize?: number;
};

const DEFAULT_PAGE_SIZE = 8;
const MAX_PAGE_SIZE = 24;

export async function listApprovedRestaurants(filters: RestaurantFilters = {}) {
  const {
    area,
    prepTimeRange,
    cuisineTypes,
    search,
    openNow = false,
    customerLat,
    customerLng,
    maxDistanceKm = DEFAULT_SERVICE_RADIUS_KM,
    sortBy = "recommended",
    page = 1,
    pageSize = DEFAULT_PAGE_SIZE,
  } = filters;

  const safePageSize = Math.min(
    Math.max(Math.trunc(pageSize) || DEFAULT_PAGE_SIZE, 1),
    MAX_PAGE_SIZE
  );
  const requestedPage = Math.max(Math.trunc(page) || 1, 1);
  const trimmedSearch = search?.trim();
  const matchedCuisineTypes = trimmedSearch
    ? Object.entries(cuisineEnumToLabel)
        .filter(([, label]) =>
          label.toLowerCase().includes(trimmedSearch.toLowerCase())
        )
        .map(([enumValue]) => enumValue as CuisineType)
    : [];

  const baseWhere: Prisma.RestaurantProfileWhereInput = {
    user: {
      status: "APPROVED",
      isSuspended: false,
    },
    ...(area ? { area } : {}),
    ...(prepTimeRange ? { prepTimeRange } : {}),
    ...(cuisineTypes && cuisineTypes.length > 0
      ? { cuisineTypes: { hasSome: cuisineTypes } }
      : {}),
    ...(trimmedSearch
      ? {
          OR: [
            {
              restaurantName: {
                contains: trimmedSearch,
                mode: "insensitive",
              },
            },
            ...(matchedCuisineTypes.length > 0
              ? [
                  {
                    cuisineTypes: { hasSome: matchedCuisineTypes },
                  },
                ]
              : []),
          ],
        }
      : {}),
  };

  const orderBy: Prisma.RestaurantProfileOrderByWithRelationInput[] =
    sortBy === "prep"
      ? [{ prepTimeRange: "asc" }, { createdAt: "desc" }]
      : sortBy === "newest"
        ? [{ createdAt: "desc" }]
        : [
            { menuItems: { _count: "desc" } },
            { prepTimeRange: "asc" },
            { createdAt: "desc" },
          ];

  const hasServiceAreaFilter =
    typeof customerLat === "number" &&
    Number.isFinite(customerLat) &&
    typeof customerLng === "number" &&
    Number.isFinite(customerLng);

  if (openNow || hasServiceAreaFilter) {
    const openNowContext = getLagosOpenNowContext();
    const where: Prisma.RestaurantProfileWhereInput =
      openNow && openNowContext
        ? {
            ...baseWhere,
            daysOpen: { has: openNowContext.weekday },
          }
        : openNow
          ? {
              ...baseWhere,
              id: "__none__",
            }
          : baseWhere;

    const candidates = await prisma.restaurantProfile.findMany({
      where,
      orderBy,
      select: {
        id: true,
        restaurantName: true,
        logoUrl: true,
        area: true,
        cuisineTypes: true,
        addressLat: true,
        addressLng: true,
        openTime: true,
        closeTime: true,
        daysOpen: true,
        prepTimeRange: true,
        createdAt: true,
        _count: {
          select: {
            menuItems: true,
          },
        },
      },
    });

    const openRestaurants =
      openNow && openNowContext
        ? candidates.filter((restaurant) =>
            isOpenAtTime(
              restaurant.openTime,
              restaurant.closeTime,
              openNowContext.time
            )
          )
        : candidates;

    const serviceableRestaurants = hasServiceAreaFilter
      ? openRestaurants.filter((restaurant) => {
          const distanceKm = calculateDistanceKm(
            { lat: customerLat, lng: customerLng },
            { lat: restaurant.addressLat, lng: restaurant.addressLng }
          );
          return distanceKm !== null && distanceKm <= maxDistanceKm;
        })
      : openRestaurants;

    const total = serviceableRestaurants.length;
    const totalPages = Math.max(1, Math.ceil(total / safePageSize));
    const currentPage = Math.min(requestedPage, totalPages);
    const skip = (currentPage - 1) * safePageSize;
    const restaurants = serviceableRestaurants.slice(skip, skip + safePageSize);

    return {
      restaurants,
      total,
      page: currentPage,
      pageSize: safePageSize,
      totalPages,
      hasPreviousPage: currentPage > 1,
      hasNextPage: currentPage < totalPages,
    };
  }

  const total = await prisma.restaurantProfile.count({ where: baseWhere });
  const totalPages = Math.max(1, Math.ceil(total / safePageSize));
  const currentPage = Math.min(requestedPage, totalPages);
  const skip = (currentPage - 1) * safePageSize;

  const restaurants = await prisma.restaurantProfile.findMany({
    where: baseWhere,
    orderBy,
    skip,
    take: safePageSize,
    select: {
      id: true,
      restaurantName: true,
      logoUrl: true,
      area: true,
      cuisineTypes: true,
      addressLat: true,
      addressLng: true,
      openTime: true,
      closeTime: true,
      daysOpen: true,
      prepTimeRange: true,
      createdAt: true,
      _count: {
        select: {
          menuItems: true,
        },
      },
    },
  });

  return {
    restaurants,
    total,
    page: currentPage,
    pageSize: safePageSize,
    totalPages,
    hasPreviousPage: currentPage > 1,
    hasNextPage: currentPage < totalPages,
  };
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
