import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DEMO_USER_ID } from "@/lib/demoUser";
import { z } from "zod";

export const dynamic = "force-dynamic";

const Schema = z.object({
  clientId: z.string().min(1),
  month: z.string().regex(/^\d{4}-\d{2}$/),
});

function monthRange(ym: string) {
  const [y, m] = ym.split("-").map(Number);
  const start = new Date(Date.UTC(y, m - 1, 1, 0, 0, 0));
  const end = new Date(Date.UTC(y, m, 1, 0, 0, 0));
  return { start, end };
}

function calcFee(client: any, spendTHB: number) {
  const feeType = (client.feeType ?? "PERCENT") as string;

  const percent = client.feePercent ? Number(client.feePercent) : 0;
  const fixed = client.feeFixedTHB ? Number(client.feeFixedTHB) : 0;

  if (feeType === "FIXED") return fixed;
  if (feeType === "HYBRID") return fixed + (spendTHB * percent) / 100;
  // PERCENT default
  return (spendTHB * percent) / 100;
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.flatten() }, { status: 400 });
  }

  const { clientId, month } = parsed.data;
  const { start, end } = monthRange(month);

  const client = await prisma.client.findFirst({
    where: { id: clientId, userId: DEMO_USER_ID },
  });
  if (!client) {
    return NextResponse.json({ ok: false, error: "Client not found" }, { status: 404 });
  }

  // prevent duplicate invoice in same month
  const exists = await prisma.clientInvoice.findFirst({
    where: { userId: DEMO_USER_ID, clientId, month },
  });
  if (exists) {
    return NextResponse.json({ ok: true, data: exists, note: "Invoice already exists" });
  }

  const spendAgg = await prisma.adSpend.aggregate({
    where: { userId: DEMO_USER_ID, clientId, date: { gte: start, lt: end } },
    _sum: { billedAmount: true },
  });

  const spendTHB = Number(spendAgg._sum.billedAmount ?? 0);
  const feeTHB = calcFee(client, spendTHB);
  const totalTHB = spendTHB + feeTHB;

  const invoice = await prisma.clientInvoice.create({
    data: {
      userId: DEMO_USER_ID,
      clientId,
      month,
      periodStart: start,
      periodEnd: new Date(end.getTime() - 1), // inclusive display
      spendTHB,
      feeTHB,
      totalTHB,
      status: "UNPAID",
    },
    include: { client: true, payments: true },
  });

  return NextResponse.json({ ok: true, data: invoice });
}
