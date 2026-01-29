import React from "react";
import { NextResponse } from "next/server";
import { renderToStream } from "@react-pdf/renderer";
import { prisma } from "@/lib/prisma";
import { InvoicePDF } from "@/lib/InvoicePdf";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ invoiceId: string }> }
) {
  try {
    // ✅ Next 16: params is Promise
    const { invoiceId } = await ctx.params;

    if (!invoiceId) {
      return NextResponse.json(
        { ok: false, error: "Missing invoiceId" },
        { status: 400 }
      );
    }

    const invoice = await prisma.clientInvoice.findUnique({
      where: { id: invoiceId },
      include: { client: true, payments: true },
    });

    if (!invoice) {
      return NextResponse.json(
        { ok: false, error: "Invoice not found" },
        { status: 404 }
      );
    }

    // ---- Decimal normalize (Prisma Decimal -> number)
    const n = (v: any) =>
      typeof v === "number" ? v : v?.toNumber ? v.toNumber() : Number(v ?? 0);

    // ---- Build data for Google-Sheet style PDF
    const pdfData = {
      header: {
        fromName: "Ye Htet - Digital",
        fromAddress: "333/64 The Urbana 2 Chiang Mai",
        fromEmail: "info@yehtet.com",
      },
      meta: {
        invoiceNo: invoice.id.slice(-6).toUpperCase(),
        invoiceDate: invoice.createdAt.toISOString().slice(0, 10),
      },
      billTo: {
        name: invoice.client?.name ?? "Client",
        address: (invoice.client as any)?.address ?? "",
      },
      serviceFor: "Media Buying",
      period: {
        start: invoice.periodStart.toISOString().slice(0, 10),
        end: invoice.periodEnd.toISOString().slice(0, 10),
      },
      lines: [
        {
          description: "Ad Spend (Billed THB)",
          amountUSD: null as number | null,
          amountTHB: n(invoice.spendTHB),
        },
        {
          description: "Manage Fee",
          amountUSD: null as number | null,
          amountTHB: n(invoice.manageFeeTHB),
        },
        {
          description: "Fixed Fee",
          amountUSD: null as number | null,
          amountTHB: n(invoice.fixedFeeTHB),
        },
      ],
      totals: {
        totalUSD: null as number | null,
        totalTHB: n(invoice.totalTHB),
      },
      paymentTerms: "Full Payment Must be Paid",
      status: invoice.status,
      payments: (invoice.payments ?? []).map((p) => ({
        date: p.date.toISOString().slice(0, 10),
        amountTHB: n(p.amountTHB),
        method: (p as any)?.method ?? "",
        note: (p as any)?.note ?? "",
      })),
    };

    // ✅ IMPORTANT: No JSX here
    const pdfDoc = React.createElement(InvoicePDF, { data: pdfData });

    const stream = await renderToStream(pdfDoc);

    return new NextResponse(stream as any, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="invoice-${invoice.id}.pdf"`,
      },
    });
  } catch (err: any) {
    console.error("Invoice PDF error:", err);
    return NextResponse.json(
      { ok: false, error: err?.message || "PDF generation failed" },
      { status: 500 }
    );
  }
}
