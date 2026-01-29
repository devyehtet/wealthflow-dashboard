import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { monthRange } from "@/lib/date";
import MonthBar from "@/components/MonthBar";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function DashboardPage({
  searchParams,
}: {
  searchParams?: { month?: string };
}) {
  const { ym, start, end } = monthRange(searchParams?.month);

  const [
    expenseAgg,
    incomeAgg,
    adSpendAgg,
    invoicesThisMonth,
    recentExpenses,
    recentAdSpends,
  ] = await Promise.all([
    prisma.expense.aggregate({
      where: { date: { gte: start, lt: end } },
      _sum: { amountTHB: true },
    }),
    prisma.income.aggregate({
      where: { date: { gte: start, lt: end } },
      _sum: { amountTHB: true },
    }),
    prisma.adSpend.aggregate({
      where: { date: { gte: start, lt: end } },
      _sum: { billedAmount: true },
    }),
    prisma.clientInvoice.findMany({
      where: {
        periodStart: { gte: start },
        periodEnd: { lte: end },
      },
      include: { client: true, payments: true },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    prisma.expense.findMany({
      where: { date: { gte: start, lt: end } },
      orderBy: { date: "desc" },
      take: 10,
    }),
    prisma.adSpend.findMany({
      where: { date: { gte: start, lt: end } },
      include: { client: true, source: true },
      orderBy: { date: "desc" },
      take: 10,
    }),
  ]);

  const totalExpense = Number(expenseAgg._sum.amountTHB ?? 0);
  const totalIncome = Number(incomeAgg._sum.amountTHB ?? 0);
  const totalAdBilled = Number(adSpendAgg._sum.billedAmount ?? 0);
  const net = totalIncome - totalExpense;

  const invoiceTotal = invoicesThisMonth.reduce((s, x) => s + Number(x.totalTHB), 0);
  const invoicePaid = invoicesThisMonth.reduce(
    (s, inv) => s + inv.payments.reduce((ss, p) => ss + Number(p.amountTHB), 0),
    0
  );
  const outstanding = invoiceTotal - invoicePaid;

  function cardClass(gradient: string) {
    return `rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.25)] backdrop-blur ${gradient}`;
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-white/10 bg-black/40 p-6 backdrop-blur">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/80">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Live Dashboard • Month {ym}
            </div>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight">
              WealthFlow Dashboard
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-white/70">
              Daily expenses + Ads billing (USD→THB) + Training + Invoices (partial/paid)
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/expenses"
              className="rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-black hover:opacity-90"
            >
              + Add Expense
              <div className="text-xs font-normal opacity-70">Grab / 7-11 / Food</div>
            </Link>
            <Link
              href="/ads"
              className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10"
            >
              📣 Add Ad Spend
              <div className="text-xs font-normal opacity-70">FB / Google / TikTok / Viber / Consulting</div>
            </Link>
            <Link
              href="/invoices"
              className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10"
            >
              🧾 Invoices
              <div className="text-xs font-normal opacity-70">Generate + payments</div>
            </Link>
            <Link
              href={`/reports/monthly?month=${ym}`}
              className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10"
            >
              📊 Monthly Report
              <div className="text-xs font-normal opacity-70">Month overview</div>
            </Link>
          </div>
        </div>

        <div className="mt-5">
          <MonthBar label="Month" />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 lg:grid-cols-4">
        <div className={cardClass("bg-gradient-to-br from-emerald-500/10 to-white/5")}>
          <div className="text-sm text-white/70">Income (THB)</div>
          <div className="mt-2 text-4xl font-semibold">{totalIncome.toFixed(2)}</div>
          <div className="mt-2 text-xs text-white/60">This month (normalized THB)</div>
        </div>

        <div className={cardClass("bg-gradient-to-br from-amber-500/10 to-white/5")}>
          <div className="text-sm text-white/70">Expenses (THB)</div>
          <div className="mt-2 text-4xl font-semibold">{totalExpense.toFixed(2)}</div>
          <div className="mt-2 text-xs text-white/60">This month</div>
        </div>

        <div className={cardClass("bg-gradient-to-br from-indigo-500/10 to-white/5")}>
          <div className="text-sm text-white/70">Net (THB)</div>
          <div className="mt-2 text-4xl font-semibold">{net.toFixed(2)}</div>
          <div className="mt-2 text-xs text-white/60">Income - Expenses</div>
        </div>

        <div className={cardClass("bg-gradient-to-br from-rose-500/10 to-white/5")}>
          <div className="text-sm text-white/70">Outstanding (THB)</div>
          <div className="mt-2 text-4xl font-semibold">{outstanding.toFixed(2)}</div>
          <div className="mt-2 text-xs text-white/60">Invoices - Paid</div>
        </div>
      </div>

      {/* 3 quick summary blocks */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-3xl border border-white/10 bg-black/40 p-6 backdrop-blur">
          <div className="flex items-center justify-between">
            <div className="font-semibold">Ad Spend (Billed THB)</div>
            <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs">
              {totalAdBilled.toFixed(2)} THB
            </div>
          </div>
          <p className="mt-2 text-sm text-white/70">
            Facebook / Google / TikTok / Viber / Consulting (platform from AdSpend)
          </p>
          <div className="mt-4 flex gap-2">
            <Link className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black" href="/ads">
              Open Ads →
            </Link>
            <Link className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10" href={`/reports/monthly?month=${ym}`}>
              View Monthly →
            </Link>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-black/40 p-6 backdrop-blur">
          <div className="flex items-center justify-between">
            <div className="font-semibold">Invoices (This Month)</div>
            <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs">
              {invoiceTotal.toFixed(2)} THB
            </div>
          </div>
          <p className="mt-2 text-sm text-white/70">
            Total: {invoiceTotal.toFixed(2)} • Paid: {invoicePaid.toFixed(2)} • Outstanding: {outstanding.toFixed(2)}
          </p>
          <div className="mt-4">
            <Link className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black" href={`/invoices?month=${ym}`}>
              Open Invoices →
            </Link>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-black/40 p-6 backdrop-blur">
          <div className="font-semibold">Quick Actions</div>
          <p className="mt-2 text-sm text-white/70">
            Add expense, add ad spend, generate invoice, add payment
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black" href="/expenses">
              Add Expense
            </Link>
            <Link className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10" href="/ads">
              Add Ad Spend
            </Link>
            <Link className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10" href="/invoices">
              Generate Invoice
            </Link>
          </div>
        </div>
      </div>

      {/* Recent tables */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-3xl border border-white/10 bg-black/40 p-6 backdrop-blur">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold">Recent Ad Spends</div>
              <div className="text-sm text-white/60">last 10 (selected month)</div>
            </div>
            <Link className="text-sm text-white/80 underline" href={`/ads?month=${ym}`}>
              Open →
            </Link>
          </div>

          <div className="mt-4 overflow-auto rounded-2xl border border-white/10">
            <table className="w-full text-sm">
              <thead className="bg-white/5 text-left text-white/60">
                <tr>
                  <th className="px-3 py-2">Date</th>
                  <th className="px-3 py-2">Client</th>
                  <th className="px-3 py-2">Source</th>
                  <th className="px-3 py-2">Platform</th>
                  <th className="px-3 py-2 text-right">THB</th>
                </tr>
              </thead>
              <tbody>
                {recentAdSpends.length === 0 ? (
                  <tr>
                    <td className="px-3 py-4 text-white/60" colSpan={5}>
                      No ad spend records for this month.
                    </td>
                  </tr>
                ) : (
                  recentAdSpends.map((x) => (
                    <tr key={x.id} className="border-t border-white/10">
                      <td className="px-3 py-2">
                        {new Date(x.date).toISOString().slice(0, 10)}
                      </td>
                      <td className="px-3 py-2">{x.client.name}</td>
                      <td className="px-3 py-2">{x.source?.name ?? "-"}</td>
                      <td className="px-3 py-2">{x.platform}</td>
                      <td className="px-3 py-2 text-right">
                        {Number(x.billedAmount).toFixed(2)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-black/40 p-6 backdrop-blur">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold">Recent Expenses</div>
              <div className="text-sm text-white/60">last 10 (selected month)</div>
            </div>
            <Link className="text-sm text-white/80 underline" href={`/expenses?month=${ym}`}>
              Open →
            </Link>
          </div>

          <div className="mt-4 overflow-auto rounded-2xl border border-white/10">
            <table className="w-full text-sm">
              <thead className="bg-white/5 text-left text-white/60">
                <tr>
                  <th className="px-3 py-2">Date</th>
                  <th className="px-3 py-2">Category</th>
                  <th className="px-3 py-2">Description</th>
                  <th className="px-3 py-2 text-right">THB</th>
                </tr>
              </thead>
              <tbody>
                {recentExpenses.length === 0 ? (
                  <tr>
                    <td className="px-3 py-4 text-white/60" colSpan={4}>
                      No expenses yet for this month.
                    </td>
                  </tr>
                ) : (
                  recentExpenses.map((x) => (
                    <tr key={x.id} className="border-t border-white/10">
                      <td className="px-3 py-2">
                        {new Date(x.date).toISOString().slice(0, 10)}
                      </td>
                      <td className="px-3 py-2">{x.category}</td>
                      <td className="px-3 py-2">{x.description ?? "-"}</td>
                      <td className="px-3 py-2 text-right">
                        {Number(x.amountTHB).toFixed(2)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-4 text-xs text-white/60">
            Tip: Facebook ads rate ကို entry တိုင်းထည့်ရင် accounting ပိုမှန်ပါတယ်။
          </div>
        </div>
      </div>
    </div>
  );
}
