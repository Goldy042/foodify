import { promises as fs } from "fs";
import path from "path";

import { generateId, generateToken } from "./auth";

export type Role = "Customer" | "Restaurant" | "Driver" | "Admin";
export type AccountStatus =
  | "EMAIL_UNVERIFIED"
  | "EMAIL_VERIFIED"
  | "PROFILE_COMPLETED"
  | "PENDING_APPROVAL"
  | "APPROVED"
  | "REJECTED";

export type User = {
  id: string;
  fullName: string;
  email: string;
  passwordHash: string;
  role: Role;
  status: AccountStatus;
  isSuspended: boolean;
  createdAt: string;
  updatedAt: string;
};

type VerificationToken = {
  id: string;
  userId: string;
  token: string;
  expiresAt: string;
  usedAt: string | null;
};

type Session = {
  id: string;
  userId: string;
  token: string;
  createdAt: string;
  expiresAt: string;
};

export type CustomerProfile = {
  id: string;
  userId: string;
  defaultAddressText: string;
  defaultAddressLat: number;
  defaultAddressLng: number;
  deliveryInstructions: string | null;
};

export type RestaurantProfile = {
  id: string;
  userId: string;
  restaurantName: string;
  logoUrl: string;
  phoneNumber: string;
  streetAddress: string;
  area: string;
  city: string;
  addressLat: number;
  addressLng: number;
  cuisineTypes: string[];
  openTime: string;
  closeTime: string;
  daysOpen: string[];
  prepTimeRange: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
};

export type DriverProfile = {
  id: string;
  userId: string;
  licenseNumber: string;
  vehicleType: string;
  plateNumber: string;
  serviceAreas: string[];
  bankName: string;
  accountNumber: string;
  accountName: string;
};

type Store = {
  users: User[];
  verificationTokens: VerificationToken[];
  sessions: Session[];
  customerProfiles: CustomerProfile[];
  restaurantProfiles: RestaurantProfile[];
  driverProfiles: DriverProfile[];
};

const DATA_DIR = path.join(process.cwd(), ".data");
const STORE_PATH = path.join(DATA_DIR, "store.json");

const DEFAULT_STORE: Store = {
  users: [],
  verificationTokens: [],
  sessions: [],
  customerProfiles: [],
  restaurantProfiles: [],
  driverProfiles: [],
};

async function ensureStoreFile() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(STORE_PATH);
  } catch {
    await fs.writeFile(STORE_PATH, JSON.stringify(DEFAULT_STORE, null, 2));
  }
}

async function readStore(): Promise<Store> {
  await ensureStoreFile();
  try {
    const raw = await fs.readFile(STORE_PATH, "utf8");
    return JSON.parse(raw) as Store;
  } catch {
    const fallback = JSON.parse(JSON.stringify(DEFAULT_STORE)) as Store;
    await fs.writeFile(STORE_PATH, JSON.stringify(fallback, null, 2));
    return fallback;
  }
}

async function writeStore(store: Store) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(STORE_PATH, JSON.stringify(store, null, 2));
}

export async function findUserByEmail(email: string) {
  const store = await readStore();
  return store.users.find((user) => user.email === email) ?? null;
}

export async function getUserById(userId: string) {
  const store = await readStore();
  return store.users.find((user) => user.id === userId) ?? null;
}

export async function createUser({
  fullName,
  email,
  passwordHash,
  role,
}: {
  fullName: string;
  email: string;
  passwordHash: string;
  role: Role;
}) {
  const store = await readStore();
  const now = new Date().toISOString();
  const existing = store.users.find((user) => user.email === email);
  if (existing) {
    throw new Error("EMAIL_EXISTS");
  }
  const user: User = {
    id: generateId(),
    fullName,
    email,
    passwordHash,
    role,
    status: "EMAIL_UNVERIFIED",
    isSuspended: false,
    createdAt: now,
    updatedAt: now,
  };
  store.users.push(user);
  await writeStore(store);
  return user;
}

export async function updateUser(userId: string, updates: Partial<User>) {
  const store = await readStore();
  const user = store.users.find((entry) => entry.id === userId);
  if (!user) {
    return null;
  }
  Object.assign(user, updates, { updatedAt: new Date().toISOString() });
  await writeStore(store);
  return user;
}

export async function createVerificationToken(userId: string) {
  const store = await readStore();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString();
  const record: VerificationToken = {
    id: generateId(),
    userId,
    token: generateToken(32),
    expiresAt,
    usedAt: null,
  };
  store.verificationTokens.push(record);
  await writeStore(store);
  return record.token;
}

export async function consumeVerificationToken(token: string) {
  const store = await readStore();
  const record = store.verificationTokens.find((entry) => entry.token === token);
  if (!record) {
    return null;
  }
  if (record.usedAt) {
    return null;
  }
  if (new Date(record.expiresAt).getTime() < Date.now()) {
    return null;
  }
  record.usedAt = new Date().toISOString();
  const user = store.users.find((entry) => entry.id === record.userId);
  if (!user) {
    return null;
  }
  user.status = "EMAIL_VERIFIED";
  user.updatedAt = new Date().toISOString();
  await writeStore(store);
  return user;
}

export async function createSession(userId: string) {
  const store = await readStore();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 1000 * 60 * 60 * 24 * 30);
  const session: Session = {
    id: generateId(),
    userId,
    token: generateToken(24),
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
  };
  store.sessions.push(session);
  await writeStore(store);
  return session.token;
}

export async function getUserBySessionToken(token: string) {
  const store = await readStore();
  const session = store.sessions.find((entry) => entry.token === token);
  if (!session) {
    return null;
  }
  if (new Date(session.expiresAt).getTime() < Date.now()) {
    return null;
  }
  return store.users.find((entry) => entry.id === session.userId) ?? null;
}

export async function getCustomerProfile(userId: string) {
  const store = await readStore();
  return store.customerProfiles.find((entry) => entry.userId === userId) ?? null;
}

export async function getRestaurantProfile(userId: string) {
  const store = await readStore();
  return store.restaurantProfiles.find((entry) => entry.userId === userId) ?? null;
}

export async function getDriverProfile(userId: string) {
  const store = await readStore();
  return store.driverProfiles.find((entry) => entry.userId === userId) ?? null;
}

export async function upsertCustomerProfile(
  userId: string,
  data: Omit<CustomerProfile, "id" | "userId">
) {
  const store = await readStore();
  const existing = store.customerProfiles.find((entry) => entry.userId === userId);
  if (existing) {
    Object.assign(existing, data);
  } else {
    store.customerProfiles.push({
      id: generateId(),
      userId,
      ...data,
    });
  }
  await writeStore(store);
}

export async function upsertRestaurantProfile(
  userId: string,
  data: Omit<RestaurantProfile, "id" | "userId">
) {
  const store = await readStore();
  const existing = store.restaurantProfiles.find((entry) => entry.userId === userId);
  if (existing) {
    Object.assign(existing, data);
  } else {
    store.restaurantProfiles.push({
      id: generateId(),
      userId,
      ...data,
    });
  }
  await writeStore(store);
}

export async function upsertDriverProfile(
  userId: string,
  data: Omit<DriverProfile, "id" | "userId">
) {
  const store = await readStore();
  const existing = store.driverProfiles.find((entry) => entry.userId === userId);
  if (existing) {
    Object.assign(existing, data);
  } else {
    store.driverProfiles.push({
      id: generateId(),
      userId,
      ...data,
    });
  }
  await writeStore(store);
}
