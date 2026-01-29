import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { monthRange } from "@/lib/date";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const month = searchParams.get("month") ?? undefined;
    const { start, end, ym } = monthRange(month);

    // ✅ Filter by periodStart in month (avoids periodEnd edge bug)
    const invoices = await prisma.clientInvoice.findMany({
      where: { periodStart: { gte: start, lt: end } },
      include: { client: true, payments: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ ok: true, month: ym, data: invoices });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Server error" },
      { status: 500 }
    );
  }
}

const CreateSchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/),
  clientId: z.string().min(1),
});

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const parsed = CreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { month, clientId } = parsed.data;
    const { start, end } = monthRange(month);

    const client = await prisma.client.findUnique({ where: { id: clientId } });
    if (!client) {
      return NextResponse.json({ ok: false, error: "Client not found" }, { status: 404 });
    }

    // ✅ prevent duplicate (clientId + periodStart)
    const exists = await prisma.clientInvoice.findFirst({
      where: { clientId, periodStart: start },
    });
    if (exists) return NextResponse.json({ ok: true, data: exists, note: "Invoice already existed" });

    const spendAgg = await prisma.adSpend.aggregate({
      where: { clientId, date: { gte: start, lt: end } },
      _sum: { billedAmount: true },
    });
    const spendTHB = Number(spendAgg._sum.billedAmount ?? 0);

    let manageFeeTHB = 0;
    let fixedFeeTHB = 0;

    if (client.feeType === "PERCENT_OF_SPEND") {
      manageFeeTHB = (spendTHB * Number(client.feePercent ?? 0)) / 100;
    } else if (client.feeType === "FIXED_MONTHLY") {
      fixedFeeTHB = Number(client.fixedMonthlyTHB ?? 0);
    } else if (client.feeType === "HYBRID") {
      manageFeeTHB = (spendTHB * Number(client.feePercent ?? 0)) / 100;
      fixedFeeTHB = Number(client.fixedMonthlyTHB ?? 0);
    }

    const totalTHB = spendTHB + manageFeeTHB + fixedFeeTHB;

    const inv = await prisma.clientInvoice.create({
      data: {
        clientId,
        periodStart: start,
        periodEnd: end,
        spendTHB,
        manageFeeTHB,
        fixedFeeTHB,
        totalTHB,
        status: totalTHB <= 0 ? "PAID" : "UNPAID",
      },
      include: { client: true, payments: true },
    });

    return NextResponse.json({ ok: true, data: inv });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Server error" },
      { status: 500 }
    );
  }
}
