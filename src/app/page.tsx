import Link from "next/link";
import { prisma } from "@/lib/prisma";

function monthRange(ym?: string) {
  const now = new Date();
  const [y, m] = (
    ym ?? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
  )
    .split("-")
    .map(Number);

  const start = new Date(y, m - 1, 1);
  const end = new Date(y, m, 1);
  const label = `${y}-${String(m).padStart(2, "0")}`;
  return { label, start, end, y, m };
}

function fmt2(n: number) {
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function ymd(d: Date) {
  return new Date(d).toISOString().slice(0, 10);
}

export default async function Home({
  searchParams,
}: {
  searchParams?: { month?: string };
}) {
  const { label, start, end, y, m } = monthRange(searchParams?.month);

  const prevMonth = m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, "0")}`;
  const nextMonth = m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, "0")}`;

  const [
    expenses,
    incomes,
    adSpends,
    invoices,
    studentPayments,
    latestEnrollments,
  ] = await Promise.all([
    prisma.expense.findMany({
      where: { date: { gte: start, lt: end } },
      orderBy: { date: "desc" },
      take: 10,
    }),
    prisma.income.findMany({
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
    prisma.clientInvoice.findMany({
      where: { periodStart: { gte: start }, periodEnd: { lte: end } },
      include: { client: true, payments: true },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.studentPayment.findMany({
      where: { date: { gte: start, lt: end } },
      include: { enrollment: { include: { student: true, course: true } } },
      orderBy: { date: "desc" },
      take: 10,
    }),
    prisma.enrollment.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { student: true, course: true },
    }),
  ]);

  const totalExpenseTHB = expenses.reduce((s, x) => s + Number(x.amountTHB), 0);
  const totalIncomeTHB = incomes.reduce((s, x) => s + Number(x.amountTHB), 0);
  const netTHB = totalIncomeTHB - totalExpenseTHB;

  const totalAdBilledTHB = adSpends.reduce((s, x) => s + Number(x.billedAmount), 0);

  const totalInvoiceTHB = invoices.reduce((s, inv) => s + Number(inv.totalTHB), 0);
  const totalPaidTHB = invoices.reduce(
    (s, inv) => s + inv.payments.reduce((ss, p) => ss + Number(p.amountTHB), 0),
    0
  );
  const outstandingTHB = totalInvoiceTHB - totalPaidTHB;

  const trainingPaidTHB = studentPayments.reduce((s, p) => s + Number(p.amountTHB), 0);

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-black dark:text-zinc-50">
      {/* Background */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-white via-zinc-50 to-zinc-100 dark:from-black dark:via-black dark:to-zinc-950" />
        <div className="absolute -top-24 left-1/2 h-72 w-[50rem] -translate-x-1/2 rounded-full bg-gradient-to-r from-indigo-200 via-sky-200 to-emerald-200 blur-3xl opacity-50 dark:from-indigo-500/20 dark:via-sky-500/20 dark:to-emerald-500/20" />
      </div>

      <main className="mx-auto max-w-7xl px-6 py-10 space-y-8">
        {/* Header */}
        <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white/70 px-3 py-1 text-xs font-medium text-zinc-700 backdrop-blur dark:border-white/10 dark:bg-white/5 dark:text-zinc-200">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Live Dashboard • Month {label}
            </div>

            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              WealthFlow Dashboard
            </h1>
            <p className="max-w-3xl text-sm leading-6 text-zinc-600 dark:text-zinc-400">
              Daily expenses + Facebook Ads billing (USD → THB) + Training payments (partial/paid)
              ကို တစ်နေရာတည်းမှာ စနစ်တကျ ကြည့်နိုင်မယ့် Dashboard ပါ။
            </p>

            {/* Month switcher */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <Link
                href={`/?month=${prevMonth}`}
                className="rounded-xl border border-zinc-200 bg-white/70 px-3 py-2 text-sm hover:bg-white dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
              >
                ← {prevMonth}
              </Link>
              <Link
                href="/"
                className="rounded-xl border border-zinc-200 bg-white/70 px-3 py-2 text-sm hover:bg-white dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
              >
                Current Month
              </Link>
              <Link
                href={`/?month=${nextMonth}`}
                className="rounded-xl border border-zinc-200 bg-white/70 px-3 py-2 text-sm hover:bg-white dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
              >
                {nextMonth} →
              </Link>
              <Link
                href={`/reports/monthly?month=${label}`}
                className="rounded-xl bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:opacity-90 dark:bg-white dark:text-black"
              >
                Open Monthly Report →
              </Link>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid w-full gap-2 sm:max-w-md sm:grid-cols-2">
            <Link
              href="/expenses"
              className="rounded-2xl bg-zinc-900 px-4 py-3 text-center text-sm font-semibold text-white shadow-sm hover:opacity-90 dark:bg-white dark:text-black"
            >
              ➕ Add Expense
              <div className="mt-1 text-xs font-normal opacity-80">
                Grab / 7-11 / Food / Kids
              </div>
            </Link>
            <Link
              href="/ads"
              className="rounded-2xl border border-zinc-200 bg-white/80 px-4 py-3 text-center text-sm font-semibold shadow-sm hover:bg-white dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
            >
              📣 Add Ad Spend
              <div className="mt-1 text-xs font-normal text-zinc-600 dark:text-zinc-400">
                USD spend → THB billed + rate
              </div>
            </Link>
            <Link
              href="/training"
              className="rounded-2xl border border-zinc-200 bg-white/80 px-4 py-3 text-center text-sm font-semibold shadow-sm hover:bg-white dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
            >
              🎓 Training
              <div className="mt-1 text-xs font-normal text-zinc-600 dark:text-zinc-400">
                Students + partial payments
              </div>
            </Link>
            <Link
              href="/reports/monthly"
              className="rounded-2xl border border-zinc-200 bg-white/80 px-4 py-3 text-center text-sm font-semibold shadow-sm hover:bg-white dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
            >
              📊 Reports
              <div className="mt-1 text-xs font-normal text-zinc-600 dark:text-zinc-400">
                Month-by-month overview
              </div>
            </Link>
          </div>
        </header>

        {/* KPI Row */}
        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Kpi
            title="Income (THB)"
            value={fmt2(totalIncomeTHB)}
            hint="This month (normalized THB)"
            accent="emerald"
          />
          <Kpi
            title="Expenses (THB)"
            value={fmt2(totalExpenseTHB)}
            hint="Grab / 7-11 / groceries..."
            accent="amber"
          />
          <Kpi
            title="Net (THB)"
            value={fmt2(netTHB)}
            hint="Income - Expenses"
            accent="indigo"
          />
          <Kpi
            title="Outstanding (THB)"
            value={fmt2(outstandingTHB)}
            hint="Invoices - Paid"
            accent="rose"
          />
        </section>

        {/* Second KPI row */}
        <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Panel title="Facebook Ads (Billed THB)" right={`${fmt2(totalAdBilledTHB)} THB`}>
            <div className="text-sm text-zinc-600 dark:text-zinc-400">
              Recent ad spend entries for {label}. (USD spend + rate snapshot)
            </div>
          </Panel>

          <Panel title="Training Payments (THB)" right={`${fmt2(trainingPaidTHB)} THB`}>
            <div className="text-sm text-zinc-600 dark:text-zinc-400">
              This month student payments (partial/full) normalized to THB.
            </div>
          </Panel>

          <Panel title="Invoices (This Month)" right={`${fmt2(totalInvoiceTHB)} THB`}>
            <div className="text-sm text-zinc-600 dark:text-zinc-400">
              Recent invoices created within the selected month period.
            </div>
          </Panel>
        </section>

        {/* Tables */}
        <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <Card title="📣 Recent Ad Spends" subtitle="Client / Page / USD → THB billed (last 10)">
            <Table>
              <thead>
                <tr>
                  <Th>Date</Th>
                  <Th>Client</Th>
                  <Th>Page</Th>
                  <Th className="text-right">USD</Th>
                  <Th className="text-right">Rate</Th>
                  <Th className="text-right">THB</Th>
                </tr>
              </thead>
              <tbody>
                {adSpends.map((x) => (
                  <tr key={x.id} className="border-t border-zinc-200/70 dark:border-white/10">
                    <Td>{ymd(x.date)}</Td>
                    <Td className="font-medium">{x.client.name}</Td>
                    <Td className="text-zinc-600 dark:text-zinc-400">{x.source?.name ?? "-"}</Td>
                    <Td className="text-right">{fmt2(Number(x.spendAmount))}</Td>
                    <Td className="text-right">{Number(x.rateUsed).toFixed(4)}</Td>
                    <Td className="text-right font-semibold">{fmt2(Number(x.billedAmount))}</Td>
                  </tr>
                ))}
                {adSpends.length === 0 && (
                  <tr>
                    <Td colSpan={6} className="py-6 text-center text-zinc-500">
                      No ad spend records for this month.
                    </Td>
                  </tr>
                )}
              </tbody>
            </Table>

            <div className="mt-4 flex gap-2">
              <Link
                href="/ads"
                className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:opacity-90 dark:bg-white dark:text-black"
              >
                Add Ad Spend
              </Link>
              <Link
                href={`/reports/monthly?month=${label}`}
                className="rounded-xl border border-zinc-200 px-4 py-2 text-sm hover:bg-zinc-50 dark:border-white/10 dark:hover:bg-white/5"
              >
                View Monthly →
              </Link>
            </div>
          </Card>

          <Card title="🧾 Recent Expenses" subtitle="Grab / 7-11 / groceries (last 10)">
            <Table>
              <thead>
                <tr>
                  <Th>Date</Th>
                  <Th>Category</Th>
                  <Th>Description</Th>
                  <Th className="text-right">THB</Th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((x) => (
                  <tr key={x.id} className="border-t border-zinc-200/70 dark:border-white/10">
                    <Td>{ymd(x.date)}</Td>
                    <Td className="font-medium">{x.category}</Td>
                    <Td className="text-zinc-600 dark:text-zinc-400">{x.description ?? "-"}</Td>
                    <Td className="text-right font-semibold">{fmt2(Number(x.amountTHB))}</Td>
                  </tr>
                ))}
                {expenses.length === 0 && (
                  <tr>
                    <Td colSpan={4} className="py-6 text-center text-zinc-500">
                      No expenses yet for this month.
                    </Td>
                  </tr>
                )}
              </tbody>
            </Table>

            <div className="mt-4 flex gap-2">
              <Link
                href="/expenses"
                className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:opacity-90 dark:bg-white dark:text-black"
              >
                Add Expense
              </Link>
              <Link
                href="/reports/monthly"
                className="rounded-xl border border-zinc-200 px-4 py-2 text-sm hover:bg-zinc-50 dark:border-white/10 dark:hover:bg-white/5"
              >
                See Report →
              </Link>
            </div>
          </Card>
        </section>

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <Card title="🎓 Recent Training Payments" subtitle="StudentPayment (last 10)">
            <Table>
              <thead>
                <tr>
                  <Th>Date</Th>
                  <Th>Student</Th>
                  <Th>Course</Th>
                  <Th className="text-right">Paid (THB)</Th>
                </tr>
              </thead>
              <tbody>
                {studentPayments.map((p) => (
                  <tr key={p.id} className="border-t border-zinc-200/70 dark:border-white/10">
                    <Td>{ymd(p.date)}</Td>
                    <Td className="font-medium">{p.enrollment.student.name}</Td>
                    <Td className="text-zinc-600 dark:text-zinc-400">
                      {p.enrollment.course.title} • {p.enrollment.course.batch}
                    </Td>
                    <Td className="text-right font-semibold">{fmt2(Number(p.amountTHB))}</Td>
                  </tr>
                ))}
                {studentPayments.length === 0 && (
                  <tr>
                    <Td colSpan={4} className="py-6 text-center text-zinc-500">
                      No training payments this month.
                    </Td>
                  </tr>
                )}
              </tbody>
            </Table>

            <div className="mt-4">
              <Link
                href="/training"
                className="rounded-xl border border-zinc-200 px-4 py-2 text-sm hover:bg-zinc-50 dark:border-white/10 dark:hover:bg-white/5"
              >
                Open Training →
              </Link>
            </div>
          </Card>

          <Card title="🧩 Recent Enrollments" subtitle="Latest students joined (last 8)">
            <div className="grid gap-3 sm:grid-cols-2">
              {latestEnrollments.map((e) => (
                <div
                  key={e.id}
                  className="rounded-2xl border border-zinc-200 bg-white/70 p-4 backdrop-blur dark:border-white/10 dark:bg-white/5"
                >
                  <div className="text-sm font-semibold">{e.student.name}</div>
                  <div className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                    {e.course.title} • {e.course.batch}
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs">
                    <span className="rounded-full border border-zinc-200 px-2 py-1 dark:border-white/10">
                      {e.status}
                    </span>
                    <span className="text-zinc-500">{ymd(e.createdAt)}</span>
                  </div>
                </div>
              ))}
              {latestEnrollments.length === 0 && (
                <div className="text-sm text-zinc-500">No enrollments yet.</div>
              )}
            </div>

            <div className="mt-4">
              <Link
                href="/training"
                className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:opacity-90 dark:bg-white dark:text-black"
              >
                Add Enrollment →
              </Link>
            </div>
          </Card>
        </section>

        <footer className="pt-4 text-sm text-zinc-600 dark:text-zinc-400">
          Tip: Facebook ads rate မတူတာတွေကို <span className="font-medium text-zinc-900 dark:text-zinc-50">per spend entry</span> နဲ့သိမ်းထားရင် accounting မှန်တယ်။
        </footer>
      </main>
    </div>
  );
}

/* ---------- UI helpers (no extra deps) ---------- */

function Kpi({
  title,
  value,
  hint,
  accent,
}: {
  title: string;
  value: string;
  hint: string;
  accent: "emerald" | "amber" | "indigo" | "rose";
}) {
  const ring =
    accent === "emerald"
      ? "from-emerald-400/25 via-emerald-200/10 to-transparent"
      : accent === "amber"
      ? "from-amber-400/25 via-amber-200/10 to-transparent"
      : accent === "indigo"
      ? "from-indigo-400/25 via-indigo-200/10 to-transparent"
      : "from-rose-400/25 via-rose-200/10 to-transparent";

  return (
    <div className="relative overflow-hidden rounded-3xl border border-zinc-200 bg-white/80 p-5 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
      <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${ring}`} />
      <div className="relative">
        <div className="text-xs text-zinc-500 dark:text-zinc-400">{title}</div>
        <div className="mt-2 text-3xl font-semibold tracking-tight">{value}</div>
        <div className="mt-2 text-xs text-zinc-600 dark:text-zinc-400">{hint}</div>
      </div>
    </div>
  );
}

function Panel({
  title,
  right,
  children,
}: {
  title: string;
  right: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-zinc-200 bg-white/80 p-5 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-semibold">{title}</div>
        <div className="rounded-full border border-zinc-200 bg-white/70 px-3 py-1 text-xs font-semibold dark:border-white/10 dark:bg-white/5">
          {right}
        </div>
      </div>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function Card({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-zinc-200 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
      <div className="flex flex-col gap-1">
        <div className="text-base font-semibold">{title}</div>
        <div className="text-sm text-zinc-600 dark:text-zinc-400">{subtitle}</div>
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function Table({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-auto rounded-2xl border border-zinc-200/70 dark:border-white/10">
      <table className="w-full text-sm">{children}</table>
    </div>
  );
}

function Th({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <th
      className={`bg-zinc-50 px-3 py-2 text-left text-xs font-semibold text-zinc-500 dark:bg-white/5 dark:text-zinc-400 ${className}`}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  className = "",
  colSpan,
}: {
  children: React.ReactNode;
  className?: string;
  colSpan?: number;
}) {
  return (
    <td className={`px-3 py-2 align-top ${className}`} colSpan={colSpan}>
      {children}
    </td>
  );
}
