import Link from "next/link";

function NavItem({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="rounded-xl px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-white/5"
    >
      {label}
    </Link>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-black dark:text-zinc-50">
      {/* background glow */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-white via-zinc-50 to-zinc-100 dark:from-black dark:via-black dark:to-zinc-950" />
        <div className="absolute -top-24 left-1/2 h-72 w-[50rem] -translate-x-1/2 rounded-full bg-gradient-to-r from-indigo-200 via-sky-200 to-emerald-200 blur-3xl opacity-50 dark:from-indigo-500/20 dark:via-sky-500/20 dark:to-emerald-500/20" />
      </div>

      <div className="mx-auto max-w-[1400px] px-4 py-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
          {/* Sidebar */}
          <aside className="rounded-3xl border border-zinc-200 bg-white/80 p-4 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
            <Link href="/" className="block">
              <div className="rounded-2xl bg-zinc-900 px-4 py-3 text-white dark:bg-white dark:text-black">
                <div className="text-sm font-semibold">WealthFlow</div>
                <div className="text-xs opacity-80">Money + Ads + Training</div>
              </div>
            </Link>

            <div className="mt-4 grid gap-1">
              <NavItem href="/" label="🏠 Dashboard" />
              <NavItem href="/expenses" label="🧾 Expenses" />
              <NavItem href="/ads" label="📣 Ads Finance" />
              <NavItem href="/training" label="🎓 Training" />
              <NavItem href="/invoices" label="🧾 Invoices" />
              <NavItem href="/reports/monthly" label="📊 Monthly Report" />
            </div>

            <div className="mt-6 rounded-2xl border border-zinc-200 bg-white/70 p-4 text-xs text-zinc-600 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300">
              <div className="font-semibold text-zinc-900 dark:text-zinc-50">
                Tip
              </div>
              <div className="mt-1 leading-5">
                USD→THB rate ကို Spend entry တိုင်းမှာ ထည့်ထားရင် accounting ပိုမှန်ပါတယ်။
              </div>
            </div>
          </aside>

          {/* Main */}
          <div className="space-y-6">
            {/* Topbar */}
            <div className="flex flex-col gap-3 rounded-3xl border border-zinc-200 bg-white/80 p-4 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400">
                  WealthFlow
                </div>
                <div className="text-lg font-semibold">Dashboard System</div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Link
                  href="/expenses"
                  className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:opacity-90 dark:bg-white dark:text-black"
                >
                  ➕ Add Expense
                </Link>
                <Link
                  href="/ads"
                  className="rounded-xl border border-zinc-200 bg-white/70 px-4 py-2 text-sm font-semibold hover:bg-white dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
                >
                  📣 Add Ad Spend
                </Link>
                <Link
                  href="/invoices"
                  className="rounded-xl border border-zinc-200 bg-white/70 px-4 py-2 text-sm font-semibold hover:bg-white dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
                >
                  🧾 Invoices
                </Link>
              </div>
            </div>

            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
