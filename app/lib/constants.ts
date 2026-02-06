export const roles = ["Customer", "Restaurant", "Driver", "Admin"] as const;

export const signupRoleOptions = ["Customer", "Restaurant", "Driver"] as const;

export const areaOptions = [
  "Lekki",
  "Ajah",
  "Yaba",
  "Surulere",
  "Ikeja",
  "Victoria Island",
  "Ikoyi",
] as const;

export const cuisineTypes = [
  "Nigerian",
  "Fast Food",
  "Continental",
  "Chinese",
  "Pizza",
  "Burgers",
  "Shawarma",
  "Grill / Barbecue",
  "Seafood",
  "Vegetarian",
  "Desserts",
  "Drinks & Beverages",
] as const;

export const menuCategories = [
  "Rice Dishes",
  "Swallow & Soup",
  "Pasta",
  "Grills",
  "Snacks",
  "Drinks",
  "Desserts",
  "Combos",
] as const;

export const measurementUnits = [
  "Plate",
  "Half Plate",
  "Bowl",
  "1kg",
  "2kg",
  "50cl",
  "60cl",
  "1L",
] as const;

export const prepTimeOptions = [
  "10-15 mins",
  "15-25 mins",
  "25-40 mins",
  "40-60 mins",
] as const;

export const vehicleTypes = ["Bike", "Car"] as const;

export const dayOptions = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

export const bankOptions = [
  "Access Bank",
  "Citibank",
  "Ecobank",
  "Fidelity Bank",
  "First Bank",
  "FCMB",
  "Globus Bank",
  "GTBank",
  "Heritage Bank",
  "Jaiz Bank",
  "Keystone Bank",
  "Kuda",
  "Lotus Bank",
  "Moniepoint",
  "Opay",
  "Polaris Bank",
  "Providus Bank",
  "Stanbic IBTC",
  "Sterling Bank",
  "SunTrust Bank",
  "Titan Trust Bank",
  "UBA",
  "Union Bank",
  "Unity Bank",
  "Wema Bank",
  "Zenith Bank",
] as const;

export const orderStatuses = [
  "PLACED",
  "PAID",
  "FAILED_PAYMENT",
  "ACCEPTED",
  "REJECTED",
  "PREPARING",
  "READY_FOR_PICKUP",
  "DRIVER_ASSIGNED",
  "PICKED_UP",
  "EN_ROUTE",
  "DELIVERED",
] as const;

export const restaurantDecisionStatuses = ["APPROVED", "REJECTED"] as const;

export const profileStatuses = [
  "EMAIL_UNVERIFIED",
  "EMAIL_VERIFIED",
  "PROFILE_COMPLETED",
  "PENDING_APPROVAL",
] as const;
