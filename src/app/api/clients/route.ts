import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const dynamic = "force-dynamic";

const ClientSchema = z.object({
  name: z.string().min(1, "Client name required"),
  feeType: z.enum(["PERCENT_OF_SPEND", "FIXED_MONTHLY", "HYBRID"]).default("PERCENT_OF_SPEND"),
  feePercent: z.coerce.number().min(0).max(100).optional().default(0),
  fixedMonthlyTHB: z.coerce.number().min(0).optional().default(0),
  invoiceCurrency: z.enum(["THB", "USD", "MMK"]).optional().default("THB"),
  notes: z.string().optional(),
});

export async function GET() {
  try {
    const clients = await prisma.client.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ ok: true, data: clients });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "Server error" }, { status: 500 });
  }
}

async function readBody(req: Request) {
  const contentType = req.headers.get("content-type") || "";

  // ✅ JSON
  if (contentType.includes("application/json")) {
    const raw = await req.text();
    if (!raw) return null;
    return JSON.parse(raw);
  }

  // ✅ Form (x-www-form-urlencoded or multipart/form-data)
  if (
    contentType.includes("application/x-www-form-urlencoded") ||
    contentType.includes("multipart/form-data")
  ) {
    const form = await req.formData();
    const obj: Record<string, any> = {};
    form.forEach((v, k) => (obj[k] = v));
    return obj;
  }

  // ✅ No body / unknown type
  const raw = await req.text();
  if (!raw) return null;
  // try json as fallback
  try {
    return JSON.parse(raw);
  } catch {
    return { _raw: raw };
  }
}

export async function POST(req: Request) {
  try {
    const body = await readBody(req);
    if (!body) {
      return NextResponse.json(
        { ok: false, error: { message: "Missing body (send JSON or form data)" } },
        { status: 400 }
      );
    }

    const parsed = ClientSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: parsed.error.flatten() }, { status: 400 });
    }

    const c = parsed.data;

    const created = await prisma.client.create({
      data: {
        name: c.name,
        feeType: c.feeType,
        feePercent: c.feePercent ?? 0,
        fixedMonthlyTHB: c.fixedMonthlyTHB ?? 0,
        invoiceCurrency: c.invoiceCurrency,
        notes: c.notes,
      },
    });

    return NextResponse.json({ ok: true, data: created });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "Server error" }, { status: 500 });
  }
}
