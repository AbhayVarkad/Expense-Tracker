import { NextResponse, type NextRequest } from "next/server";
import { parseAmount } from "@/lib/expenses";
import { prisma } from "@/lib/prisma";
import { toPublicSettings } from "@/lib/serialize";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const CURRENCY_PATTERN = /^[A-Z]{3}$/;

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const settings = await prisma.settings.upsert({
    where: { profileId: id },
    update: {},
    create: { profileId: id },
  });
  return NextResponse.json(toPublicSettings(settings));
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const body: unknown = await request.json().catch(() => null);
  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  const { currency: rawCurrency, monthlyBudget: rawBudget } = body as Record<string, unknown>;

  const data: { currency?: string; monthlyBudget?: number | null } = {};
  if (typeof rawCurrency === "string" && CURRENCY_PATTERN.test(rawCurrency)) {
    data.currency = rawCurrency;
  }
  if (Object.hasOwn(body as object, "monthlyBudget")) {
    if (rawBudget === null) {
      data.monthlyBudget = null;
    } else {
      const budget = parseAmount(rawBudget);
      if (budget === null) {
        return NextResponse.json({ error: "Invalid monthly budget." }, { status: 400 });
      }
      data.monthlyBudget = budget;
    }
  }

  const settings = await prisma.settings.upsert({
    where: { profileId: id },
    update: data,
    create: { profileId: id, ...data },
  });
  return NextResponse.json(toPublicSettings(settings));
}
