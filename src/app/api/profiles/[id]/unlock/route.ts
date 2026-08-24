import { NextResponse, type NextRequest } from "next/server";
import { verifyPin } from "@/lib/pin";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * Verifies a profile's PIN entirely on the server, so the hash and salt
 * never need to reach the browser. Still a convenience lock, not real
 * authentication: there is no session or rate limiting behind it.
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const body: unknown = await request.json().catch(() => ({}));
  const pin =
    typeof body === "object" && body !== null && typeof (body as Record<string, unknown>).pin === "string"
      ? ((body as Record<string, unknown>).pin as string)
      : "";

  const profile = await prisma.profile.findUnique({ where: { id } });
  if (profile === null) {
    return NextResponse.json({ error: "Profile not found." }, { status: 404 });
  }

  const ok = await verifyPin(pin, profile.pinSalt, profile.pinHash);
  if (!ok) {
    return NextResponse.json({ error: "That PIN is not right." }, { status: 401 });
  }
  return NextResponse.json({ ok: true });
}
