import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const dynamic = "force-dynamic";

const Schema = z.object({
  date: z.string().min(1), // "YYYY-MM-DD"
  amountTHB: z.number().positive(),
  method: z.string().optional(),
  note: z.string().optional(),
});

function toDateOnly(d: string) {
  // date input: "YYYY-MM-DD"
  const [y, m, day] = d.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, day ?? 1);
}

export async function POST(
  req: Request,
  ctx: { params: Promise<{ invoiceId: string }> } // ✅ Next 16: params is Promise
) {
  try {
    const { invoiceId } = await ctx.params; // ✅ unwrap params

    // ✅ validate invoiceId
    if (!invoiceId || typeof invoiceId !== "string") {
      return NextResponse.json(
        { ok: false, error: "Missing invoiceId" },
        { status: 400 }
      );
    }

    const body = await req.json().catch(() => null);
    const parsed = Schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            formErrors: parsed.error.issues.map((i) => i.message),
            fieldErrors: parsed.error.flatten().fieldErrors,
          },
        },
        { status: 400 }
      );
    }

    const { date, amountTHB, method, note } = parsed.data;

    // ✅ fetch invoice safely
    const invoice = await prisma.clientInvoice.findUnique({
      where: { id: invoiceId },
      include: { payments: true },
    });

    if (!invoice) {
      return NextResponse.json(
        { ok: false, error: "Invoice not found" },
        { status: 404 }
      );
    }

    // ✅ create payment
    await prisma.clientPayment.create({
      data: {
        invoiceId,
        date: toDateOnly(date),
        amountTHB,
        method: method ?? null,
        note: note ?? null,
      },
    });

    // ✅ recompute status
    const updated = await prisma.clientInvoice.findUnique({
      where: { id: invoiceId },
      include: { payments: true },
    });

    if (!updated) {
      return NextResponse.json(
        { ok: false, error: "Invoice missing after update" },
        { status: 500 }
      );
    }

    const totalPaid = updated.payments.reduce(
      (sum, p) => sum + Number(p.amountTHB),
      0
    );
    const totalTHB = Number(updated.totalTHB);

    let status: "UNPAID" | "PARTIAL" | "PAID" = "UNPAID";
    if (totalPaid <= 0) status = "UNPAID";
    else if (totalPaid >= totalTHB) status = "PAID";
    else status = "PARTIAL";

    const finalInvoice = await prisma.clientInvoice.update({
      where: { id: invoiceId },
      data: { status },
      include: { client: true, payments: true },
    });

    return NextResponse.json({ ok: true, data: finalInvoice });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message ?? "Server error" },
      { status: 500 }
    );
  }
}
