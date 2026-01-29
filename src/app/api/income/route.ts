import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  date: z.string().min(1),
  type: z.string().min(1),
  description: z.string().optional(),
  currency: z.enum(["THB", "USD", "MMK"]),
  amount: z.string().min(1),
  exchangeRate: z.string().optional(),
});

export async function POST(req: Request) {
  const form = await req.formData();
  const parsed = schema.safeParse({
    date: form.get("date"),
    type: form.get("type"),
    description: (form.get("description") as string) || undefined,
    currency: form.get("currency"),
    amount: form.get("amount"),
    exchangeRate: (form.get("exchangeRate") as string) || undefined,
  });
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });

  const amount = Number(parsed.data.amount);
  const currency = parsed.data.currency;
  const rate = parsed.data.exchangeRate ? Number(parsed.data.exchangeRate) : undefined;

  const amountTHB =
    currency === "THB" ? amount : amount * (rate ?? 0);

  if (currency !== "THB" && (!rate || rate <= 0)) {
    return NextResponse.json({ error: "Exchange rate required for USD/MMK" }, { status: 400 });
  }

  await prisma.income.create({
    data: {
      date: new Date(parsed.data.date),
      type: parsed.data.type,
      description: parsed.data.description,
      currency,
      amount,
      exchangeRate: rate,
      amountTHB,
    },
  });

  return NextResponse.redirect(new URL("/income", req.url), { status: 302 });
}
