import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const form = await req.formData();
  const password = String(form.get("password") || "");
  const ok = password && password === process.env.APP_PASSWORD;

  if (!ok) {
    return NextResponse.redirect(new URL("/login", req.url), { status: 302 });
  }

  const res = NextResponse.redirect(new URL("/", req.url), { status: 302 });
  res.cookies.set("wf_auth", "1", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
  return res;
}
