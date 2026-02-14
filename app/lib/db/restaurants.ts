import prisma from "@/lib/prisma";
import {
  Prisma,
  Area,
  CuisineType,
  PrepTimeRange,
  MenuCategoryType,
} from "@/app/generated/prisma/client";
import { cuisineEnumToLabel, menuCategoryEnumToLabel } from "./mappers";
import {
  calculateDistanceKm,
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
  maxDistanceKm?: number | null;
  sortBy?: RestaurantSortBy;
  page?: number;
  pageSize?: number;
};

const DEFAULT_PAGE_SIZE = 8;
const MAX_PAGE_SIZE = 24;
const SELLABLE_MEASUREMENT_WHERE: Prisma.MenuItemMeasurementWhereInput = {
  basePrice: { gt: 0 },
};
const SELLABLE_MENU_ITEM_WHERE: Prisma.MenuItemWhereInput = {
  isAvailable: true,
  measurements: {
    some: SELLABLE_MEASUREMENT_WHERE,
  },
};

function withSellableMenuItemWhere(
  where: Prisma.MenuItemWhereInput = {}
): Prisma.MenuItemWhereInput {
  return {
    ...where,
    ...SELLABLE_MENU_ITEM_WHERE,
  };
}

async function buildSellableMenuItemCountMap(restaurantIds: string[]) {
  if (restaurantIds.length === 0) {
    return new Map<string, number>();
  }

  const counts = await prisma.menuItem.groupBy({
    by: ["restaurantId"],
    where: withSellableMenuItemWhere({
      restaurantId: { in: restaurantIds },
    }),
    _count: { _all: true },
  });

  return new Map(
    counts.map((entry) => [entry.restaurantId, entry._count._all] as const)
  );
}

function getMatchedCuisineTypesFromSearch(search?: string) {
  if (!search?.trim()) {
    return [];
  }
  const lower = search.toLowerCase();
  return Object.entries(cuisineEnumToLabel)
    .filter(([, label]) => label.toLowerCase().includes(lower))
    .map(([enumValue]) => enumValue as CuisineType);
}

function getMatchedMenuCategoriesFromSearch(search?: string) {
  if (!search?.trim()) {
    return [];
  }
  const lower = search.toLowerCase();
  return Object.entries(menuCategoryEnumToLabel)
    .filter(([, label]) => label.toLowerCase().includes(lower))
    .map(([enumValue]) => enumValue as MenuCategoryType);
}

function buildRestaurantSearchWhere(
  trimmedSearch?: string
): Prisma.RestaurantProfileWhereInput {
  if (!trimmedSearch) {
    return {};
  }

  const matchedCuisineTypes = getMatchedCuisineTypesFromSearch(trimmedSearch);
  const matchedMenuCategories = getMatchedMenuCategoriesFromSearch(trimmedSearch);

  return {
    OR: [
      {
        restaurantName: {
          contains: trimmedSearch,
          mode: "insensitive",
        },
      },
      {
        menuItems: {
          some: withSellableMenuItemWhere({
            OR: [
              { name: { contains: trimmedSearch, mode: "insensitive" } },
              { description: { contains: trimmedSearch, mode: "insensitive" } },
              ...(matchedMenuCategories.length > 0
                ? [{ category: { category: { in: matchedMenuCategories } } }]
                : []),
            ],
          }),
        },
      },
      ...(matchedCuisineTypes.length > 0
        ? [{ cuisineTypes: { hasSome: matchedCuisineTypes } }]
        : []),
    ],
  };
}

export async function listApprovedRestaurants(filters: RestaurantFilters = {}) {
  const {
    area,
    prepTimeRange,
    cuisineTypes,
    search,
    openNow = false,
    customerLat,
    customerLng,
    maxDistanceKm = null,
    sortBy,
    page = 1,
    pageSize = DEFAULT_PAGE_SIZE,
  } = filters;

  const safePageSize = Math.min(
    Math.max(Math.trunc(pageSize) || DEFAULT_PAGE_SIZE, 1),
    MAX_PAGE_SIZE
  );
  const requestedPage = Math.max(Math.trunc(page) || 1, 1);
  const trimmedSearch = search?.trim();

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
    ...buildRestaurantSearchWhere(trimmedSearch),
  };

  const orderBy: Prisma.RestaurantProfileOrderByWithRelationInput[] | undefined =
    sortBy === "prep"
      ? [{ prepTimeRange: "asc" }, { createdAt: "desc" }]
      : sortBy === "newest"
        ? [{ createdAt: "desc" }]
        : sortBy === "recommended"
          ? [
            { menuItems: { _count: "desc" } },
            { prepTimeRange: "asc" },
            { createdAt: "desc" },
            ]
          : undefined;

  const hasServiceAreaFilter =
    typeof customerLat === "number" &&
    Number.isFinite(customerLat) &&
    typeof customerLng === "number" &&
    Number.isFinite(customerLng);
  const hasDistanceFilter =
    hasServiceAreaFilter &&
    typeof maxDistanceKm === "number" &&
    Number.isFinite(maxDistanceKm) &&
    maxDistanceKm > 0;

  if (openNow || hasDistanceFilter) {
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
        menuItems: {
          where: SELLABLE_MENU_ITEM_WHERE,
          orderBy: { createdAt: "desc" },
          take: 3,
          select: { name: true },
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

    const serviceableRestaurants = hasDistanceFilter
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

    const sellableCountMap = await buildSellableMenuItemCountMap(
      restaurants.map((restaurant) => restaurant.id)
    );

    return {
      restaurants: restaurants.map((restaurant) => ({
        ...restaurant,
        sellableMenuItemCount: sellableCountMap.get(restaurant.id) ?? 0,
      })),
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
      menuItems: {
        where: SELLABLE_MENU_ITEM_WHERE,
        orderBy: { createdAt: "desc" },
        take: 3,
        select: { name: true },
      },
    },
  });

  const sellableCountMap = await buildSellableMenuItemCountMap(
    restaurants.map((restaurant) => restaurant.id)
  );

  return {
    restaurants: restaurants.map((restaurant) => ({
      ...restaurant,
      sellableMenuItemCount: sellableCountMap.get(restaurant.id) ?? 0,
    })),
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
            where: SELLABLE_MENU_ITEM_WHERE,
            orderBy: { createdAt: "asc" },
            include: {
              measurements: {
                where: SELLABLE_MEASUREMENT_WHERE,
                orderBy: { createdAt: "asc" },
              },
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
