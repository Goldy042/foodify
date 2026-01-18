import crypto from "crypto";

const HASH_DELIMITER = ":";
const KEY_LENGTH = 64;

export function hashPassword(password: string) {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = crypto.scryptSync(password, salt, KEY_LENGTH).toString("hex");
  return `${salt}${HASH_DELIMITER}${derivedKey}`;
}

export function verifyPassword(password: string, storedHash: string) {
  const [salt, storedKey] = storedHash.split(HASH_DELIMITER);
  if (!salt || !storedKey) {
    return false;
  }
  const derivedKey = crypto.scryptSync(password, salt, KEY_LENGTH);
  const storedBuffer = Buffer.from(storedKey, "hex");
  if (storedBuffer.length !== derivedKey.length) {
    return false;
  }
  return crypto.timingSafeEqual(storedBuffer, derivedKey);
}

export function generateToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString("hex");
}

export function generateId() {
  return crypto.randomUUID();
}
