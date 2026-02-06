import {
  Area,
  BankName,
  CuisineType,
  DayOfWeek,
  PrepTimeRange,
  Role,
  VehicleType,
} from "@/app/generated/prisma/client";

export const roleLabelToEnum = {
  Customer: Role.CUSTOMER,
  Restaurant: Role.RESTAURANT,
  Driver: Role.DRIVER,
} as const;

export const areaLabelToEnum = {
  Lekki: Area.LEKKI,
  Ajah: Area.AJAH,
  Yaba: Area.YABA,
  Surulere: Area.SURULERE,
  Ikeja: Area.IKEJA,
  "Victoria Island": Area.VICTORIA_ISLAND,
  Ikoyi: Area.IKOYI,
} as const;

export const areaEnumToLabel: Record<Area, string> = {
  [Area.LEKKI]: "Lekki",
  [Area.AJAH]: "Ajah",
  [Area.YABA]: "Yaba",
  [Area.SURULERE]: "Surulere",
  [Area.IKEJA]: "Ikeja",
  [Area.VICTORIA_ISLAND]: "Victoria Island",
  [Area.IKOYI]: "Ikoyi",
};

export const cuisineLabelToEnum = {
  Nigerian: CuisineType.NIGERIAN,
  "Fast Food": CuisineType.FAST_FOOD,
  Continental: CuisineType.CONTINENTAL,
  Chinese: CuisineType.CHINESE,
  Pizza: CuisineType.PIZZA,
  Burgers: CuisineType.BURGERS,
  Shawarma: CuisineType.SHAWARMA,
  "Grill / Barbecue": CuisineType.GRILL_BARBECUE,
  Seafood: CuisineType.SEAFOOD,
  Vegetarian: CuisineType.VEGETARIAN,
  Desserts: CuisineType.DESSERTS,
  "Drinks & Beverages": CuisineType.DRINKS_BEVERAGES,
} as const;

export const cuisineEnumToLabel: Record<CuisineType, string> = {
  [CuisineType.NIGERIAN]: "Nigerian",
  [CuisineType.FAST_FOOD]: "Fast Food",
  [CuisineType.CONTINENTAL]: "Continental",
  [CuisineType.CHINESE]: "Chinese",
  [CuisineType.PIZZA]: "Pizza",
  [CuisineType.BURGERS]: "Burgers",
  [CuisineType.SHAWARMA]: "Shawarma",
  [CuisineType.GRILL_BARBECUE]: "Grill / Barbecue",
  [CuisineType.SEAFOOD]: "Seafood",
  [CuisineType.VEGETARIAN]: "Vegetarian",
  [CuisineType.DESSERTS]: "Desserts",
  [CuisineType.DRINKS_BEVERAGES]: "Drinks & Beverages",
};

export const dayLabelToEnum = {
  Monday: DayOfWeek.MONDAY,
  Tuesday: DayOfWeek.TUESDAY,
  Wednesday: DayOfWeek.WEDNESDAY,
  Thursday: DayOfWeek.THURSDAY,
  Friday: DayOfWeek.FRIDAY,
  Saturday: DayOfWeek.SATURDAY,
  Sunday: DayOfWeek.SUNDAY,
} as const;

export const dayEnumToLabel: Record<DayOfWeek, string> = {
  [DayOfWeek.MONDAY]: "Monday",
  [DayOfWeek.TUESDAY]: "Tuesday",
  [DayOfWeek.WEDNESDAY]: "Wednesday",
  [DayOfWeek.THURSDAY]: "Thursday",
  [DayOfWeek.FRIDAY]: "Friday",
  [DayOfWeek.SATURDAY]: "Saturday",
  [DayOfWeek.SUNDAY]: "Sunday",
};

export const prepTimeLabelToEnum = {
  "10-15 mins": PrepTimeRange.MINS_10_15,
  "15-25 mins": PrepTimeRange.MINS_15_25,
  "25-40 mins": PrepTimeRange.MINS_25_40,
  "40-60 mins": PrepTimeRange.MINS_40_60,
} as const;

export const prepTimeEnumToLabel: Record<PrepTimeRange, string> = {
  [PrepTimeRange.MINS_10_15]: "10-15 mins",
  [PrepTimeRange.MINS_15_25]: "15-25 mins",
  [PrepTimeRange.MINS_25_40]: "25-40 mins",
  [PrepTimeRange.MINS_40_60]: "40-60 mins",
};

export const bankLabelToEnum = {
  "Access Bank": BankName.ACCESS_BANK,
  Citibank: BankName.CITIBANK,
  Ecobank: BankName.ECOBANK,
  "Fidelity Bank": BankName.FIDELITY_BANK,
  "First Bank": BankName.FIRST_BANK,
  FCMB: BankName.FCMB,
  "Globus Bank": BankName.GLOBUS_BANK,
  GTBank: BankName.GTBANK,
  "Heritage Bank": BankName.HERITAGE_BANK,
  "Jaiz Bank": BankName.JAIZ_BANK,
  "Keystone Bank": BankName.KEYSTONE_BANK,
  Kuda: BankName.KUDA,
  "Lotus Bank": BankName.LOTUS_BANK,
  Moniepoint: BankName.MONIEPOINT,
  Opay: BankName.OPAY,
  "Polaris Bank": BankName.POLARIS_BANK,
  "Providus Bank": BankName.PROVIDUS_BANK,
  "Stanbic IBTC": BankName.STANBIC_IBTC,
  "Sterling Bank": BankName.STERLING_BANK,
  "SunTrust Bank": BankName.SUNTRUST_BANK,
  "Titan Trust Bank": BankName.TITAN_TRUST_BANK,
  UBA: BankName.UBA,
  "Union Bank": BankName.UNION_BANK,
  "Unity Bank": BankName.UNITY_BANK,
  "Wema Bank": BankName.WEMA_BANK,
  "Zenith Bank": BankName.ZENITH_BANK,
} as const;

export const bankEnumToLabel: Record<BankName, string> = {
  [BankName.ACCESS_BANK]: "Access Bank",
  [BankName.CITIBANK]: "Citibank",
  [BankName.ECOBANK]: "Ecobank",
  [BankName.FIDELITY_BANK]: "Fidelity Bank",
  [BankName.FIRST_BANK]: "First Bank",
  [BankName.FCMB]: "FCMB",
  [BankName.GLOBUS_BANK]: "Globus Bank",
  [BankName.GTBANK]: "GTBank",
  [BankName.HERITAGE_BANK]: "Heritage Bank",
  [BankName.JAIZ_BANK]: "Jaiz Bank",
  [BankName.KEYSTONE_BANK]: "Keystone Bank",
  [BankName.KUDA]: "Kuda",
  [BankName.LOTUS_BANK]: "Lotus Bank",
  [BankName.MONIEPOINT]: "Moniepoint",
  [BankName.OPAY]: "Opay",
  [BankName.POLARIS_BANK]: "Polaris Bank",
  [BankName.PROVIDUS_BANK]: "Providus Bank",
  [BankName.STANBIC_IBTC]: "Stanbic IBTC",
  [BankName.STERLING_BANK]: "Sterling Bank",
  [BankName.SUNTRUST_BANK]: "SunTrust Bank",
  [BankName.TITAN_TRUST_BANK]: "Titan Trust Bank",
  [BankName.UBA]: "UBA",
  [BankName.UNION_BANK]: "Union Bank",
  [BankName.UNITY_BANK]: "Unity Bank",
  [BankName.WEMA_BANK]: "Wema Bank",
  [BankName.ZENITH_BANK]: "Zenith Bank",
};

export const vehicleLabelToEnum = {
  Bike: VehicleType.BIKE,
  Car: VehicleType.CAR,
} as const;

export const vehicleEnumToLabel: Record<VehicleType, string> = {
  [VehicleType.BIKE]: "Bike",
  [VehicleType.CAR]: "Car",
};

export function mapAreas(labels: readonly string[]) {
  const mapped = labels
    .map((label) => areaLabelToEnum[label as keyof typeof areaLabelToEnum])
    .filter(Boolean);
  return mapped.length === labels.length ? mapped : null;
}

export function mapCuisineTypes(labels: readonly string[]) {
  const mapped = labels
    .map((label) => cuisineLabelToEnum[label as keyof typeof cuisineLabelToEnum])
    .filter(Boolean);
  return mapped.length === labels.length ? mapped : null;
}

export function mapDays(labels: readonly string[]) {
  const mapped = labels
    .map((label) => dayLabelToEnum[label as keyof typeof dayLabelToEnum])
    .filter(Boolean);
  return mapped.length === labels.length ? mapped : null;
}
