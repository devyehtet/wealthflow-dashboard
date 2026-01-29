import { prisma } from "@/lib/prisma";

function ymd(d: Date) {
  return new Date(d).toISOString().slice(0, 10);
}
function fmt2(n: number) {
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default async function AdsPage() {
  const [clients, sources, spends] = await Promise.all([
    prisma.client.findMany({ orderBy: { createdAt: "desc" }, take: 100 }),
    prisma.adSource.findMany({
      include: { client: true },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    prisma.adSpend.findMany({
      include: { client: true, source: true },
      orderBy: { date: "desc" },
      take: 30,
    }),
  ]);

  const totalBilled = spends.reduce((s, x) => s + Number(x.billedAmount), 0);

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-zinc-200 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400">Business</div>
            <h1 className="text-2xl font-semibold">Ads Finance (Multi-Platform)</h1>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Facebook / Google / TikTok / Viber / Consulting → USD → THB billed + client invoices.
            </p>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-white/70 px-4 py-3 text-sm font-semibold dark:border-white/10 dark:bg-white/5">
            Recent billed: {fmt2(totalBilled)} THB
          </div>
        </div>

        {/* Create Client */}
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-zinc-200 bg-white/70 p-4 dark:border-white/10 dark:bg-white/5">
            <div className="font-semibold">Add Client</div>
            <form action="/api/clients" method="POST" className="mt-3 grid gap-3 md:grid-cols-2">
              <input name="name" placeholder="Client name" className="rounded-xl border p-3 md:col-span-2" required />
              <input name="feePercent" type="number" step="0.01" placeholder="Manage fee % (e.g. 15)" className="rounded-xl border p-3" />
              <select name="feeType" className="rounded-xl border p-3" defaultValue="PERCENT_OF_SPEND">
                <option value="PERCENT_OF_SPEND">Percent of spend</option>
                <option value="FIXED_MONTHLY">Fixed monthly</option>
                <option value="HYBRID">Hybrid</option>
              </select>
              <input name="fixedMonthlyTHB" type="number" step="0.01" placeholder="Fixed monthly THB" className="rounded-xl border p-3" />
              <select name="invoiceCurrency" className="rounded-xl border p-3" defaultValue="THB">
                <option value="THB">THB</option>
                <option value="USD">USD</option>
                <option value="MMK">MMK</option>
              </select>
              <button className="rounded-xl bg-zinc-900 px-4 py-3 text-sm font-semibold text-white hover:opacity-90 dark:bg-white dark:text-black md:col-span-2">
                Create Client
              </button>
            </form>
          </div>

          {/* Create Source */}
          <div className="rounded-2xl border border-zinc-200 bg-white/70 p-4 dark:border-white/10 dark:bg-white/5">
            <div className="font-semibold">Add Page / Ad Account</div>
            <form action="/api/sources" method="POST" className="mt-3 grid gap-3 md:grid-cols-2">
              <select name="clientId" className="rounded-xl border p-3 md:col-span-2" required>
                <option value="">Select client</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <select name="type" className="rounded-xl border p-3" defaultValue="PAGE">
                <option value="PAGE">PAGE</option>
                <option value="AD_ACCOUNT">AD_ACCOUNT</option>
              </select>
              <input name="name" placeholder="Page / Ad account name" className="rounded-xl border p-3" required />
              <input name="sourceId" placeholder="Page ID (optional)" className="rounded-xl border p-3" />
              <input name="note" placeholder="Note (optional)" className="rounded-xl border p-3" />
              <button className="rounded-xl bg-zinc-900 px-4 py-3 text-sm font-semibold text-white hover:opacity-90 dark:bg-white dark:text-black md:col-span-2">
                Add Source
              </button>
            </form>
          </div>
        </div>

        {/* Add Spend */}
        <div className="mt-6 rounded-2xl border border-zinc-200 bg-white/70 p-4 dark:border-white/10 dark:bg-white/5">
          <div className="font-semibold">Add Spend (Any Platform → THB billed)</div>
          <form action="/api/adspend" method="POST" className="mt-3 grid gap-3 md:grid-cols-9">
            <input name="date" type="date" className="rounded-xl border p-3 md:col-span-2" required />

            <select name="platform" className="rounded-xl border p-3 md:col-span-2" defaultValue="FACEBOOK">
              <option value="FACEBOOK">Facebook Ads</option>
              <option value="GOOGLE">Google Ads</option>
              <option value="TIKTOK">TikTok Ads</option>
              <option value="VIBER">Viber Ads</option>
              <option value="CONSULTING">Consulting</option>
              <option value="OTHER">Other</option>
            </select>

            <select name="clientId" className="rounded-xl border p-3 md:col-span-3" required>
              <option value="">Client</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <select name="sourceId" className="rounded-xl border p-3 md:col-span-2">
              <option value="">Page/Source (optional)</option>
              {sources.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.client.name} • {s.name}
                </option>
              ))}
            </select>

            <input name="spendAmount" type="number" step="0.01" placeholder="Spend USD" className="rounded-xl border p-3 md:col-span-2" required />
            <input name="rateUsed" type="number" step="0.0001" placeholder="USD→THB rate" className="rounded-xl border p-3 md:col-span-2" required />

            <input name="note" placeholder="Note (optional)" className="rounded-xl border p-3 md:col-span-5" />
            <button className="rounded-xl bg-zinc-900 px-4 py-3 text-sm font-semibold text-white hover:opacity-90 dark:bg-white dark:text-black md:col-span-4">
              Save Spend
            </button>
          </form>

          <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
            billedTHB = spendUSD × rateUsed. (Server calculates.)
          </p>
        </div>
      </div>

      {/* Recent spends table */}
      <div className="rounded-3xl border border-zinc-200 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
        <div className="text-base font-semibold">Recent Spends</div>

        <div className="mt-4 overflow-auto rounded-2xl border border-zinc-200/70 dark:border-white/10">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-zinc-50 text-left text-xs font-semibold text-zinc-500 dark:bg-white/5 dark:text-zinc-400">
                <th className="px-3 py-2">Date</th>
                <th className="px-3 py-2">Platform</th>
                <th className="px-3 py-2">Client</th>
                <th className="px-3 py-2">Source</th>
                <th className="px-3 py-2 text-right">USD</th>
                <th className="px-3 py-2 text-right">Rate</th>
                <th className="px-3 py-2 text-right">THB</th>
              </tr>
            </thead>
            <tbody>
              {spends.map((x) => (
                <tr key={x.id} className="border-t border-zinc-200/70 dark:border-white/10">
                  <td className="px-3 py-2">{ymd(x.date)}</td>
                  <td className="px-3 py-2 font-medium">{x.platform}</td>
                  <td className="px-3 py-2">{x.client.name}</td>
                  <td className="px-3 py-2 text-zinc-600 dark:text-zinc-400">{x.source?.name ?? "-"}</td>
                  <td className="px-3 py-2 text-right">{fmt2(Number(x.spendAmount))}</td>
                  <td className="px-3 py-2 text-right">{Number(x.rateUsed).toFixed(4)}</td>
                  <td className="px-3 py-2 text-right font-semibold">{fmt2(Number(x.billedAmount))}</td>
                </tr>
              ))}
              {spends.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-3 py-6 text-center text-zinc-500">
                    No spends yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
