import { DayOfWeek } from "@/app/generated/prisma/client";

export const DEFAULT_SERVICE_RADIUS_KM = 20;

const lagosWeekdayToEnum: Record<string, DayOfWeek> = {
  Monday: DayOfWeek.MONDAY,
  Tuesday: DayOfWeek.TUESDAY,
  Wednesday: DayOfWeek.WEDNESDAY,
  Thursday: DayOfWeek.THURSDAY,
  Friday: DayOfWeek.FRIDAY,
  Saturday: DayOfWeek.SATURDAY,
  Sunday: DayOfWeek.SUNDAY,
};

export function parseTimeToMinutes(time: string) {
  const [hoursRaw, minutesRaw] = time.split(":");
  const hours = Number.parseInt(hoursRaw, 10);
  const minutes = Number.parseInt(minutesRaw, 10);
  if (
    !Number.isInteger(hours) ||
    !Number.isInteger(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return null;
  }
  return hours * 60 + minutes;
}

export function isOpenAtTime(
  openTime: string,
  closeTime: string,
  currentTime: string
) {
  const openMinutes = parseTimeToMinutes(openTime);
  const closeMinutes = parseTimeToMinutes(closeTime);
  const currentMinutes = parseTimeToMinutes(currentTime);
  if (
    openMinutes === null ||
    closeMinutes === null ||
    currentMinutes === null
  ) {
    return false;
  }

  if (openMinutes === closeMinutes) {
    return true;
  }
  if (openMinutes < closeMinutes) {
    return currentMinutes >= openMinutes && currentMinutes < closeMinutes;
  }
  return currentMinutes >= openMinutes || currentMinutes < closeMinutes;
}

export function getLagosOpenNowContext() {
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Lagos",
    weekday: "long",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = formatter.formatToParts(new Date());
  const weekdayLabel = parts.find((part) => part.type === "weekday")?.value;
  const hour = parts.find((part) => part.type === "hour")?.value;
  const minute = parts.find((part) => part.type === "minute")?.value;

  if (!weekdayLabel || !hour || !minute) {
    return null;
  }
  const weekday = lagosWeekdayToEnum[weekdayLabel];
  if (!weekday) {
    return null;
  }

  return {
    weekday,
    time: `${hour}:${minute}`,
  };
}

export function isRestaurantOpenNow(input: {
  daysOpen: readonly DayOfWeek[];
  openTime: string;
  closeTime: string;
}) {
  const context = getLagosOpenNowContext();
  if (!context) {
    return false;
  }
  if (!input.daysOpen.includes(context.weekday)) {
    return false;
  }
  return isOpenAtTime(input.openTime, input.closeTime, context.time);
}

function toNumber(value: unknown) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  if (
    value &&
    typeof value === "object" &&
    "toNumber" in value &&
    typeof (value as { toNumber?: unknown }).toNumber === "function"
  ) {
    const parsed = (value as { toNumber: () => number }).toNumber();
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

export function calculateDistanceKm(
  from: { lat: unknown; lng: unknown },
  to: { lat: unknown; lng: unknown }
) {
  const fromLat = toNumber(from.lat);
  const fromLng = toNumber(from.lng);
  const toLat = toNumber(to.lat);
  const toLng = toNumber(to.lng);
  if (
    fromLat === null ||
    fromLng === null ||
    toLat === null ||
    toLng === null
  ) {
    return null;
  }

  const toRad = (value: number) => (value * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const dLat = toRad(toLat - fromLat);
  const dLng = toRad(toLng - fromLng);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(fromLat)) *
      Math.cos(toRad(toLat)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
}
