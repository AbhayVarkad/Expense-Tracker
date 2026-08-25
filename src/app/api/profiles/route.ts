import { NextResponse, type NextRequest } from "next/server";
import { PROFILE_COLORS } from "@/lib/categories";
import { MAX_NAME_LENGTH, MAX_PIN_LENGTH, MIN_PIN_LENGTH, sanitizeText } from "@/lib/expenses";
import { generateSalt, hashPin, isValidPinFormat } from "@/lib/pin";
import { prisma } from "@/lib/prisma";
import { toPublicProfile } from "@/lib/serialize";

export async function GET() {
  const profiles = await prisma.profile.findMany({ orderBy: { createdAt: "asc" } });
  return NextResponse.json(profiles.map(toPublicProfile));
}

export async function POST(request: NextRequest) {
  const body: unknown = await request.json().catch(() => null);
  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  const { name: rawName, color: rawColor, pin: rawPin } = body as Record<string, unknown>;

  const name = sanitizeText(rawName, MAX_NAME_LENGTH);
  if (name === "") {
    return NextResponse.json({ error: "Give this profile a name." }, { status: 400 });
  }

  const color =
    typeof rawColor === "string" && PROFILE_COLORS.includes(rawColor)
      ? rawColor
      : PROFILE_COLORS[0];

  const pin = typeof rawPin === "string" ? rawPin : "";
  if (!isValidPinFormat(pin, MIN_PIN_LENGTH, MAX_PIN_LENGTH)) {
    return NextResponse.json(
      { error: `Use ${MIN_PIN_LENGTH} to ${MAX_PIN_LENGTH} digits for the PIN.` },
      { status: 400 },
    );
  }
  const pinSalt = generateSalt();
  const pinHash = await hashPin(pin, pinSalt);

  const profile = await prisma.profile.create({
    data: { name, color, pinSalt, pinHash, settings: { create: {} } },
  });

  return NextResponse.json(toPublicProfile(profile), { status: 201 });
}
