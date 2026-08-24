import { NextResponse, type NextRequest } from "next/server";
import { PROFILE_COLORS } from "@/lib/categories";
import { MAX_NAME_LENGTH, sanitizeText } from "@/lib/expenses";
import { prisma } from "@/lib/prisma";
import { toPublicProfile } from "@/lib/serialize";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const body: unknown = await request.json().catch(() => null);
  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  const { name: rawName, color: rawColor } = body as Record<string, unknown>;

  const data: { name?: string; color?: string } = {};
  if (typeof rawName === "string") {
    const name = sanitizeText(rawName, MAX_NAME_LENGTH);
    if (name === "") {
      return NextResponse.json({ error: "Name cannot be empty." }, { status: 400 });
    }
    data.name = name;
  }
  if (typeof rawColor === "string" && PROFILE_COLORS.includes(rawColor)) {
    data.color = rawColor;
  }

  try {
    const profile = await prisma.profile.update({ where: { id }, data });
    return NextResponse.json(toPublicProfile(profile));
  } catch {
    return NextResponse.json({ error: "Profile not found." }, { status: 404 });
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  try {
    await prisma.profile.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Profile not found." }, { status: 404 });
  }
}
