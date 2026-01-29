import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DEMO_USER_ID } from "@/lib/demoUser";
import { z } from "zod";

export const dynamic = "force-dynamic";

const Schema = z.object({
  invoiceId: z.string().min(1),
  date: z.string().min(1), // YYYY-MM-DD
  amountTHB: z.number().positive(),
  method: z.string().optional(),
  note: z.string().optional(),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.flatten() }, { status: 400 });
  }

  const { invoiceId, date, amountTHB, method, note } = parsed.data;

  const invoice = await prisma.clientInvoice.findFirst({
    where: { id: invoiceId, userId: DEMO_USER_ID },
    include: { payments: true },
  });

  if (!invoice) {
    return NextResponse.json({ ok: false, error: "Invoice not found" }, { status: 404 });
  }

  const payment = await prisma.invoicePayment.create({
    data: {
      userId: DEMO_USER_ID,
      invoiceId,
      date: new Date(date + "T00:00:00.000Z"),
      amountTHB,
      method: method ?? null,
      note: note ?? null,
    },
  });

  const paid = invoice.payments.reduce((s, p) => s + Number(p.amountTHB), 0) + amountTHB;
  const total = Number(invoice.totalTHB);
  const status = paid <= 0 ? "UNPAID" : paid + 0.00001 < total ? "PARTIAL" : "PAID";

  const updated = await prisma.clientInvoice.update({
    where: { id: invoiceId },
    data: { status },
    include: { client: true, payments: true },
  });

  return NextResponse.json({ ok: true, data: { payment, invoice: updated } });
}
