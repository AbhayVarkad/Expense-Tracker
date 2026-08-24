/**
 * PIN handling for local profiles.
 *
 * This is a convenience lock, not authentication. The salted hash is
 * generated and checked entirely on the server (see the `/api/profiles`
 * routes), so the browser never sees it, but there is still no session,
 * rate limiting, or account recovery behind it. It only stops casual
 * shoulder-surfing between people sharing one browser or device. Never
 * treat a profile PIN as a security boundary or reuse a real password here.
 */

const SALT_BYTES = 16;

function toHex(bytes: Uint8Array): string {
  return [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function isPinCapable(): boolean {
  return (
    typeof crypto !== "undefined" &&
    typeof crypto.getRandomValues === "function" &&
    typeof crypto.subtle?.digest === "function"
  );
}

export function generateSalt(): string {
  const bytes = new Uint8Array(SALT_BYTES);
  crypto.getRandomValues(bytes);
  return toHex(bytes);
}

export async function hashPin(pin: string, salt: string): Promise<string> {
  const data = new TextEncoder().encode(`${salt}:${pin}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return toHex(new Uint8Array(digest));
}

/** Length-independent comparison so a wrong PIN does not leak timing hints. */
function constantTimeEquals(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let index = 0; index < a.length; index += 1) {
    diff |= a.charCodeAt(index) ^ b.charCodeAt(index);
  }
  return diff === 0;
}

export async function verifyPin(
  pin: string,
  salt: string | null,
  hash: string | null,
): Promise<boolean> {
  if (salt === null || hash === null) return true;
  if (!isPinCapable()) return false;
  const candidate = await hashPin(pin, salt);
  return constantTimeEquals(candidate, hash);
}

export function isValidPinFormat(pin: string, min: number, max: number): boolean {
  return new RegExp(`^\\d{${min},${max}}$`).test(pin);
}
