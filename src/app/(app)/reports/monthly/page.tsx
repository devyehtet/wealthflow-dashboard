import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { monthRange } from "@/lib/date";
import MonthBar from "@/components/MonthBar";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function MonthlyReportPage({
  searchParams,
}: {
  searchParams?: { month?: string };
}) {
  const { ym, start, end } = monthRange(searchParams?.month);

  const [expenses, incomes, adSpends, invoices] = await Promise.all([
    prisma.expense.findMany({
      where: { date: { gte: start, lt: end } },
      orderBy: { date: "desc" },
    }),
    prisma.income.findMany({
      where: { date: { gte: start, lt: end } },
      orderBy: { date: "desc" },
    }),
    prisma.adSpend.findMany({
      where: { date: { gte: start, lt: end } },
      include: { client: true, source: true },
      orderBy: { date: "desc" },
    }),
    prisma.clientInvoice.findMany({
      where: {
        periodStart: { gte: start },
        periodEnd: { lte: end },
      },
      include: { client: true, payments: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const totalExpenseTHB = expenses.reduce((s, x) => s + Number(x.amountTHB), 0);
  const totalIncomeTHB = incomes.reduce((s, x) => s + Number(x.amountTHB), 0);
  const totalAdSpendTHB = adSpends.reduce((s, x) => s + Number(x.billedAmount), 0);

  const totalInvoiceTHB = invoices.reduce((s, x) => s + Number(x.totalTHB), 0);
  const totalPaidTHB = invoices.reduce(
    (s, inv) => s + inv.payments.reduce((ss, p) => ss + Number(p.amountTHB), 0),
    0
  );
  const outstandingTHB = totalInvoiceTHB - totalPaidTHB;
  const netTHB = totalIncomeTHB - totalExpenseTHB;

  const Stat = ({ title, value, hint }: { title: string; value: string; hint?: string }) => (
    <div className="rounded-3xl border border-white/10 bg-black/40 p-6 backdrop-blur">
      <div className="text-sm text-white/70">{title}</div>
      <div className="mt-2 text-4xl font-semibold">{value}</div>
      {hint ? <div className="mt-2 text-xs text-white/60">{hint}</div> : null}
    </div>
  );

  return (
    <main className="space-y-6">
      {/* Top bar */}
      <div className="rounded-3xl border border-white/10 bg-black/40 p-6 backdrop-blur">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="text-sm text-white/60">Monthly Report</div>
            <div className="text-3xl font-semibold">{ym}</div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black" href={`/?month=${ym}`}>
              ← Dashboard
            </Link>
            <Link className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10" href={`/expenses?month=${ym}`}>
              Expenses
            </Link>
            <Link className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10" href={`/ads?month=${ym}`}>
              Ads
            </Link>
            <Link className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10" href={`/training?month=${ym}`}>
              Training
            </Link>
            <Link className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10" href={`/invoices?month=${ym}`}>
              Invoices
            </Link>
          </div>
        </div>

        <div className="mt-4">
          <MonthBar label="Month" />
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 lg:grid-cols-4">
        <Stat title="Income (THB)" value={totalIncomeTHB.toFixed(2)} />
        <Stat title="Expenses (THB)" value={totalExpenseTHB.toFixed(2)} />
        <Stat title="Net (THB)" value={netTHB.toFixed(2)} hint="Income - Expenses" />
        <Stat title="Outstanding (THB)" value={outstandingTHB.toFixed(2)} hint="Invoices - Paid" />
      </div>

      {/* Ads table */}
      <section className="rounded-3xl border border-white/10 bg-black/40 p-6 backdrop-blur space-y-3">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Ad Spend (This Month)</h2>
            <div className="text-sm text-white/60">
              Facebook / Google / TikTok / Viber / Consulting (platform stored in AdSpend)
            </div>
          </div>
          <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm">
            Total billed: <span className="font-semibold">{totalAdSpendTHB.toFixed(2)} THB</span>
          </div>
        </div>

        <div className="overflow-auto rounded-2xl border border-white/10">
          <table className="w-full text-sm">
            <thead className="bg-white/5 text-left text-white/60">
              <tr>
                <th className="px-3 py-2">Date</th>
                <th className="px-3 py-2">Client</th>
                <th className="px-3 py-2">Source</th>
                <th className="px-3 py-2">Platform</th>
                <th className="px-3 py-2 text-right">Spend</th>
                <th className="px-3 py-2 text-right">Rate</th>
                <th className="px-3 py-2 text-right">Billed (THB)</th>
              </tr>
            </thead>
            <tbody>
              {adSpends.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-3 py-4 text-white/60">
                    No ad spend records for this month. Go to <Link className="underline" href={`/ads?month=${ym}`}>Ads</Link>.
                  </td>
                </tr>
              ) : (
                adSpends.map((x) => (
                  <tr key={x.id} className="border-t border-white/10">
                    <td className="px-3 py-2">{new Date(x.date).toISOString().slice(0, 10)}</td>
                    <td className="px-3 py-2">{x.client.name}</td>
                    <td className="px-3 py-2">{x.source?.name ?? "-"}</td>
                    <td className="px-3 py-2">{x.platform}</td>
                    <td className="px-3 py-2 text-right">{Number(x.spendAmount).toFixed(2)}</td>
                    <td className="px-3 py-2 text-right">{Number(x.rateUsed).toFixed(4)}</td>
                    <td className="px-3 py-2 text-right">{Number(x.billedAmount).toFixed(2)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Invoice summary */}
      <section className="rounded-3xl border border-white/10 bg-black/40 p-6 backdrop-blur space-y-3">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Client Invoices (This Month)</h2>
            <div className="text-sm text-white/60">UNPAID → PARTIAL → PAID</div>
          </div>
          <div className="flex gap-2">
            <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm">
              Total: <span className="font-semibold">{totalInvoiceTHB.toFixed(2)} THB</span>
            </div>
            <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm">
              Paid: <span className="font-semibold">{totalPaidTHB.toFixed(2)} THB</span>
            </div>
          </div>
        </div>

        <div className="overflow-auto rounded-2xl border border-white/10">
          <table className="w-full text-sm">
            <thead className="bg-white/5 text-left text-white/60">
              <tr>
                <th className="px-3 py-2">Client</th>
                <th className="px-3 py-2">Period</th>
                <th className="px-3 py-2 text-right">Total</th>
                <th className="px-3 py-2 text-right">Paid</th>
                <th className="px-3 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3 py-4 text-white/60">
                    No invoices for this month. Go to{" "}
                    <Link className="underline" href={`/invoices?month=${ym}`}>Invoices</Link>.
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => {
                  const paid = inv.payments.reduce((s, p) => s + Number(p.amountTHB), 0);
                  return (
                    <tr key={inv.id} className="border-t border-white/10">
                      <td className="px-3 py-2">{inv.client.name}</td>
                      <td className="px-3 py-2">
                        {new Date(inv.periodStart).toISOString().slice(0, 10)} →{" "}
                        {new Date(inv.periodEnd).toISOString().slice(0, 10)}
                      </td>
                      <td className="px-3 py-2 text-right">{Number(inv.totalTHB).toFixed(2)}</td>
                      <td className="px-3 py-2 text-right">{paid.toFixed(2)}</td>
                      <td className="px-3 py-2">{inv.status}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
