import "server-only";

import { hash, verify } from "@node-rs/argon2";

// OWASP-recommended Argon2id parameters.
const ARGON2_OPTIONS = {
  memoryCost: 19456,
  timeCost: 2,
  outputLen: 32,
  parallelism: 1,
} as const;

export function hashPassword(password: string): Promise<string> {
  return hash(password, ARGON2_OPTIONS);
}

export function verifyPasswordHash(
  hashedPassword: string,
  password: string,
): Promise<boolean> {
  return verify(hashedPassword, password, ARGON2_OPTIONS);
}
