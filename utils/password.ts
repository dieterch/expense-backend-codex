import { compare, hash } from "bcrypt";

const BCRYPT_PREFIX = "$2";
const PASSWORD_HASH_ROUNDS = 10;

export function isPasswordHash(value: string | null | undefined): boolean {
  return typeof value === "string" && value.startsWith(BCRYPT_PREFIX);
}

export async function hashPassword(password: string): Promise<string> {
  return hash(password, PASSWORD_HASH_ROUNDS);
}

export async function verifyPassword(candidate: string, storedPassword: string): Promise<boolean> {
  if (isPasswordHash(storedPassword)) {
    return compare(candidate, storedPassword);
  }

  return candidate === storedPassword;
}

export function passwordNeedsUpgrade(storedPassword: string): boolean {
  return !isPasswordHash(storedPassword);
}
