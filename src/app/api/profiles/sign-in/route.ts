import { NextResponse, type NextRequest } from "next/server";
import { MAX_NAME_LENGTH, MAX_PIN_LENGTH, MIN_PIN_LENGTH, sanitizeText } from "@/lib/expenses";
import { isValidPinFormat, verifyPin } from "@/lib/pin";
import { prisma } from "@/lib/prisma";
import { toPublicProfile } from "@/lib/serialize";

/**
 * Sign in with name + PIN from any device. Finds matching profiles in the
 * database, verifies the PIN server-side, and returns the public profile.
 */
export async function POST(request: NextRequest) {
  const body: unknown = await request.json().catch(() => null);
  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { name: rawName, pin: rawPin } = body as Record<string, unknown>;
  const name = sanitizeText(rawName, MAX_NAME_LENGTH);
  const pin = typeof rawPin === "string" ? rawPin : "";

  if (name === "") {
    return NextResponse.json({ error: "Enter your name." }, { status: 400 });
  }
  if (!isValidPinFormat(pin, MIN_PIN_LENGTH, MAX_PIN_LENGTH)) {
    return NextResponse.json(
      { error: `Use ${MIN_PIN_LENGTH} to ${MAX_PIN_LENGTH} digits for the PIN.` },
      { status: 400 },
    );
  }

  const candidates = await prisma.profile.findMany({
    where: {
      name: { equals: name, mode: "insensitive" },
      pinHash: { not: null },
    },
  });

  if (candidates.length === 0) {
    return NextResponse.json({ error: "Name or PIN is wrong." }, { status: 401 });
  }

  let matched: (typeof candidates)[number] | null = null;
  for (const profile of candidates) {
    const ok = await verifyPin(pin, profile.pinSalt, profile.pinHash);
    if (ok) {
      matched = profile;
      break;
    }
  }

  if (matched === null) {
    return NextResponse.json({ error: "Name or PIN is wrong." }, { status: 401 });
  }

  return NextResponse.json(toPublicProfile(matched));
}
