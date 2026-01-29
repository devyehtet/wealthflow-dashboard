import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { addMonths, monthRange } from "@/lib/dates";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams?: { month?: string };
}) {
  const { ym, start, end } = monthRange(searchParams?.month);
  const prev = addMonths(ym, -1);
  const next = addMonths(ym, +1);

  const [expenseAgg, incomeAgg, adSpendAgg, invoicesThisMonth, trainingAgg] =
    await Promise.all([
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
        where: { periodStart: { gte: start }, periodEnd: { lte: end } },
        include: { payments: true },
        take: 50,
      }),
      prisma.studentPayment.aggregate({
        where: { date: { gte: start, lt: end } },
        _sum: { amountTHB: true },
      }),
    ]);

  const totalExpense = Number(expenseAgg._sum.amountTHB ?? 0);
  const totalIncome = Number(incomeAgg._sum.amountTHB ?? 0);
  const totalAdCost = Number(adSpendAgg._sum.billedAmount ?? 0);
  const totalTraining = Number(trainingAgg._sum.amountTHB ?? 0);

  const totalInvoiceTHB = invoicesThisMonth.reduce((s, inv) => s + Number(inv.totalTHB), 0);
  const totalPaidTHB = invoicesThisMonth.reduce(
    (s, inv) => s + inv.payments.reduce((ss, p) => ss + Number(p.amountTHB), 0),
    0
  );
  const outstanding = totalInvoiceTHB - totalPaidTHB;

  const net = totalIncome - totalExpense;

  return (
    <div className="space-y-6">
      {/* Header + Month switcher */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border bg-white/70 px-3 py-1 text-xs text-zinc-600 dark:bg-white/5 dark:text-zinc-300">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Live Dashboard • Month {ym}
          </div>
          <h1 className="mt-3 text-4xl font-black tracking-tight">WealthFlow Dashboard</h1>
          <p className="mt-2 max-w-2xl text-zinc-600 dark:text-zinc-300">
            Month-based view (income / expenses / ads / training / invoices). Use the month switcher to browse.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href={`/?month=${prev}`}
            className="rounded-xl border bg-white/70 px-4 py-2 text-sm font-semibold hover:bg-white dark:bg-white/5 dark:hover:bg-white/10"
          >
            ← {prev}
          </Link>
          <Link
            href={`/?month=${monthRange().ym}`}
            className="rounded-xl border bg-white/70 px-4 py-2 text-sm font-semibold hover:bg-white dark:bg-white/5 dark:hover:bg-white/10"
          >
            Current Month
          </Link>
          <Link
            href={`/?month=${next}`}
            className="rounded-xl border bg-white/70 px-4 py-2 text-sm font-semibold hover:bg-white dark:bg-white/5 dark:hover:bg-white/10"
          >
            {next} →
          </Link>

          <Link
            href={`/reports/monthly?month=${ym}`}
            className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:opacity-90 dark:bg-white dark:text-black"
          >
            Open Monthly Report →
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-3xl border bg-white/80 p-6 shadow-sm dark:bg-white/5">
          <div className="text-sm text-zinc-500">Income (THB)</div>
          <div className="mt-2 text-4xl font-extrabold">{totalIncome.toFixed(2)}</div>
          <div className="mt-2 text-xs text-zinc-500">Selected month: {ym}</div>
        </div>

        <div className="rounded-3xl border bg-white/80 p-6 shadow-sm dark:bg-white/5">
          <div className="text-sm text-zinc-500">Expenses (THB)</div>
          <div className="mt-2 text-4xl font-extrabold">{totalExpense.toFixed(2)}</div>
          <div className="mt-2 text-xs text-zinc-500">Selected month: {ym}</div>
        </div>

        <div className="rounded-3xl border bg-white/80 p-6 shadow-sm dark:bg-white/5">
          <div className="text-sm text-zinc-500">Net (THB)</div>
          <div className="mt-2 text-4xl font-extrabold">{net.toFixed(2)}</div>
          <div className="mt-2 text-xs text-zinc-500">Income - Expenses</div>
        </div>

        <div className="rounded-3xl border bg-white/80 p-6 shadow-sm dark:bg-white/5">
          <div className="text-sm text-zinc-500">Outstanding (THB)</div>
          <div className="mt-2 text-4xl font-extrabold">{outstanding.toFixed(2)}</div>
          <div className="mt-2 text-xs text-zinc-500">Invoices - Paid (within month)</div>
        </div>
      </div>

      {/* Secondary summary */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-3xl border bg-white/80 p-5 shadow-sm dark:bg-white/5">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold">Ads Cost (THB billed)</div>
            <div className="rounded-full border px-3 py-1 text-xs">{totalAdCost.toFixed(2)} THB</div>
          </div>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
            This is billed THB (USD spend × rate). Month: {ym}
          </p>
          <Link className="mt-4 inline-flex text-sm font-semibold underline" href={`/ads?month=${ym}`}>
            Open Ads →
          </Link>
        </div>

        <div className="rounded-3xl border bg-white/80 p-5 shadow-sm dark:bg-white/5">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold">Training Payments (THB)</div>
            <div className="rounded-full border px-3 py-1 text-xs">{totalTraining.toFixed(2)} THB</div>
          </div>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
            Student payments normalized to THB. Month: {ym}
          </p>
          <Link className="mt-4 inline-flex text-sm font-semibold underline" href={`/training?month=${ym}`}>
            Open Training →
          </Link>
        </div>

        <div className="rounded-3xl border bg-white/80 p-5 shadow-sm dark:bg-white/5">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold">Invoices (This Month)</div>
            <div className="rounded-full border px-3 py-1 text-xs">{totalInvoiceTHB.toFixed(2)} THB</div>
          </div>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
            Total invoice amount created for month {ym}.
          </p>
          <Link className="mt-4 inline-flex text-sm font-semibold underline" href={`/invoices?month=${ym}`}>
            Open Invoices →
          </Link>
        </div>
      </div>
    </div>
  );
}
