import { NextResponse, type NextRequest } from "next/server";
import { isCategoryId, isPaymentMethod } from "@/lib/categories";
import { MAX_NOTE_LENGTH, isValidDateString, parseAmount, sanitizeText, todayISO } from "@/lib/expenses";
import { prisma } from "@/lib/prisma";
import { toPublicExpense } from "@/lib/serialize";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const expenses = await prisma.expense.findMany({
    where: { profileId: id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(expenses.map(toPublicExpense));
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const body: unknown = await request.json().catch(() => null);
  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  const { amount: rawAmount, category, note, date, paymentMethod } = body as Record<string, unknown>;

  const amount = parseAmount(rawAmount);
  if (amount === null) {
    return NextResponse.json({ error: "Enter an amount greater than zero." }, { status: 400 });
  }

  try {
    const expense = await prisma.expense.create({
      data: {
        profileId: id,
        amount,
        category: isCategoryId(category) ? category : "other",
        paymentMethod: isPaymentMethod(paymentMethod) ? paymentMethod : "other",
        date: isValidDateString(date) ? date : todayISO(),
        note: sanitizeText(note, MAX_NOTE_LENGTH),
      },
    });
    return NextResponse.json(toPublicExpense(expense), { status: 201 });
  } catch {
    return NextResponse.json({ error: "Profile not found." }, { status: 404 });
  }
}
