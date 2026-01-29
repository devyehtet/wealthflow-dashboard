import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  clientId: z.string().min(1),
  type: z.string().min(1),
  name: z.string().min(1),
  notes: z.string().optional(),
});

export async function POST(req: Request) {
  const form = await req.formData();
  const parsed = schema.safeParse({
    clientId: form.get("clientId"),
    type: form.get("type"),
    name: form.get("name"),
    notes: (form.get("notes") as string) || undefined,
  });
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });

  await prisma.adSource.create({
    data: parsed.data,
  });

  return NextResponse.redirect(new URL(`/clients/${parsed.data.clientId}`, req.url), { status: 302 });
}
