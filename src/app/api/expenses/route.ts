import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DEMO_USER_ID } from "@/lib/demoUser";
import { z } from "zod";

const CreateExpenseSchema = z.object({
  date: z.string(),
  category: z.string().min(1),
  description: z.string().optional(),
  amountTHB: z.coerce.number().positive(),
  method: z.string().optional(),
});

/**
 * GET /api/expenses
 */
export async function GET() {
  try {
    const expenses = await prisma.expense.findMany({
      orderBy: { date: "desc" },
      take: 50,
    });

    // normalize Decimal → number
    const data = expenses.map((e) => ({
      ...e,
      amountTHB: Number(e.amountTHB),
    }));

    return NextResponse.json({ ok: true, data });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { ok: false, error: "Failed to fetch expenses" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/expenses
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = CreateExpenseSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const expense = await prisma.expense.create({
      data: {
        date: new Date(parsed.data.date),
        category: parsed.data.category,
        description: parsed.data.description,
        amountTHB: parsed.data.amountTHB,
        method: parsed.data.method,
      },
    });

    return NextResponse.json({
      ok: true,
      data: {
        ...expense,
        amountTHB: Number(expense.amountTHB),
      },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { ok: false, error: "Create expense failed" },
      { status: 500 }
    );
  }
}
