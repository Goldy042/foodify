import assert from "node:assert/strict";
import test from "node:test";

import {
  calculateDistanceKm,
  DEFAULT_SERVICE_RADIUS_KM,
  isOpenAtTime,
  parseTimeToMinutes,
} from "@/app/lib/restaurant-availability";

test("parseTimeToMinutes parses valid times", () => {
  assert.equal(parseTimeToMinutes("00:00"), 0);
  assert.equal(parseTimeToMinutes("09:45"), 585);
  assert.equal(parseTimeToMinutes("23:59"), 1439);
});

test("parseTimeToMinutes returns null for invalid values", () => {
  assert.equal(parseTimeToMinutes(""), null);
  assert.equal(parseTimeToMinutes("ab:cd"), null);
  assert.equal(parseTimeToMinutes("24:00"), null);
  assert.equal(parseTimeToMinutes("12:60"), null);
});

test("isOpenAtTime handles same-day windows", () => {
  assert.equal(isOpenAtTime("09:00", "17:00", "09:00"), true);
  assert.equal(isOpenAtTime("09:00", "17:00", "16:59"), true);
  assert.equal(isOpenAtTime("09:00", "17:00", "17:00"), false);
  assert.equal(isOpenAtTime("09:00", "17:00", "08:59"), false);
});

test("isOpenAtTime handles overnight windows", () => {
  assert.equal(isOpenAtTime("20:00", "02:00", "23:30"), true);
  assert.equal(isOpenAtTime("20:00", "02:00", "01:59"), true);
  assert.equal(isOpenAtTime("20:00", "02:00", "12:00"), false);
});

test("isOpenAtTime treats matching open and close as 24h open", () => {
  assert.equal(isOpenAtTime("00:00", "00:00", "03:15"), true);
  assert.equal(isOpenAtTime("12:00", "12:00", "21:45"), true);
});

test("isOpenAtTime returns false when inputs are invalid", () => {
  assert.equal(isOpenAtTime("invalid", "17:00", "09:00"), false);
  assert.equal(isOpenAtTime("09:00", "17:00", "invalid"), false);
});

test("calculateDistanceKm returns near-zero distance for identical coordinates", () => {
  const distance = calculateDistanceKm(
    { lat: 6.5244, lng: 3.3792 },
    { lat: 6.5244, lng: 3.3792 }
  );
  assert.notEqual(distance, null);
  assert.ok((distance ?? 1) < 0.001);
});

test("calculateDistanceKm accepts decimal-like objects and applies service radius", () => {
  const distance = calculateDistanceKm(
    { lat: { toNumber: () => 6.5244 }, lng: { toNumber: () => 3.3792 } },
    { lat: { toNumber: () => 6.6018 }, lng: { toNumber: () => 3.3515 } }
  );
  assert.notEqual(distance, null);
  assert.ok((distance ?? 0) < DEFAULT_SERVICE_RADIUS_KM);
});

test("calculateDistanceKm returns null for invalid coordinate values", () => {
  assert.equal(
    calculateDistanceKm({ lat: "x", lng: 3.3 }, { lat: 6.5, lng: 3.4 }),
    null
  );
  assert.equal(
    calculateDistanceKm({ lat: 6.5, lng: 3.4 }, { lat: NaN, lng: 3.2 }),
    null
  );
});
