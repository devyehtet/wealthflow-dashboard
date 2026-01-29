import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  date: z.string().min(1),
  platform: z.enum(["FACEBOOK", "GOOGLE", "TIKTOK", "VIBER", "CONSULTING", "OTHER"]).default("FACEBOOK"),
  clientId: z.string().min(1),
  sourceId: z.string().optional(),
  spendAmount: z.coerce.number().positive(),
  rateUsed: z.coerce.number().positive(),
  note: z.string().optional(),
});

export async function POST(req: Request) {
  const form = await req.formData();

  const parsed = schema.safeParse({
    date: String(form.get("date") ?? ""),
    platform: (form.get("platform") ? String(form.get("platform")) : "FACEBOOK") as any,
    clientId: String(form.get("clientId") ?? ""),
    sourceId: form.get("sourceId") ? String(form.get("sourceId")) : undefined,
    spendAmount: form.get("spendAmount"),
    rateUsed: form.get("rateUsed"),
    note: form.get("note") ? String(form.get("note")) : undefined,
  });

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { date, platform, clientId, sourceId, spendAmount, rateUsed, note } = parsed.data;

  const billedAmount = spendAmount * rateUsed;

  // NOTE: userId field မင်း schema မှာရှိရင် ဒီလိုယူရမယ် (auth မလုပ်သေးရင် fallback)
  // 지금은 simplest: userId ကို optional မဟုတ်ရင် schema မှာ userId remove/optional လုပ်သင့်
  // အခု code မှာ userId မထည့်ပါ (မင်း schema အလိုက်လိုရင် ပြော—auth stub ထည့်ပေးမယ်)

  await prisma.adSpend.create({
    data: {
      date: new Date(date),
      platform: platform as any,
      clientId,
      sourceId: sourceId || null,

      spendCurrency: "USD",
      spendAmount: spendAmount as any,

      billingCurrency: "THB",
      rateUsed: rateUsed as any,
      billedAmount: billedAmount as any,

      note: note || null,
    },
  });

  return NextResponse.redirect(new URL("/ads", req.url), 303);
}
