import { NextResponse, type NextRequest } from "next/server";
import { isCategoryId, isPaymentMethod } from "@/lib/categories";
import { MAX_NOTE_LENGTH, isValidDateString, parseAmount, sanitizeText } from "@/lib/expenses";
import { prisma } from "@/lib/prisma";
import { toPublicExpense } from "@/lib/serialize";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
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
  if (!isValidDateString(date)) {
    return NextResponse.json({ error: "Invalid date." }, { status: 400 });
  }

  try {
    const expense = await prisma.expense.update({
      where: { id },
      data: {
        amount,
        category: isCategoryId(category) ? category : "other",
        paymentMethod: isPaymentMethod(paymentMethod) ? paymentMethod : "other",
        date,
        note: sanitizeText(note, MAX_NOTE_LENGTH),
      },
    });
    return NextResponse.json(toPublicExpense(expense));
  } catch {
    return NextResponse.json({ error: "Expense not found." }, { status: 404 });
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  try {
    await prisma.expense.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Expense not found." }, { status: 404 });
  }
}
