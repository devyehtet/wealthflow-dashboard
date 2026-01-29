import { prisma } from "@/lib/prisma";

export default async function IncomePage() {
  const items = await prisma.income.findMany({ orderBy: { date: "desc" }, take: 50 });

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Income</h1>

      <form action="/api/income" method="POST" className="rounded-2xl border p-4 grid gap-3 md:grid-cols-6">
        <input name="date" type="date" className="rounded-xl border p-3" required />
        <input name="type" placeholder="Training / Ads Service / Other" className="rounded-xl border p-3" required />
        <input name="description" placeholder="Notes (optional)" className="rounded-xl border p-3" />
        <select name="currency" className="rounded-xl border p-3" defaultValue="THB">
          <option value="THB">THB</option>
          <option value="MMK">MMK</option>
          <option value="USD">USD</option>
        </select>
        <input name="amount" type="number" step="0.01" placeholder="Amount" className="rounded-xl border p-3" required />
        <input name="exchangeRate" type="number" step="0.0001" placeholder="Rate to THB (if not THB)" className="rounded-xl border p-3" />
        <button className="rounded-xl border p-3 hover:bg-black hover:text-white md:col-span-6">
          Add Income
        </button>
      </form>

      <div className="rounded-2xl border overflow-hidden">
        <div className="p-3 text-sm text-gray-600 border-b">Latest 50</div>
        <div className="divide-y">
          {items.map((x) => (
            <div key={x.id} className="p-3 flex justify-between text-sm">
              <div>
                <div className="font-medium">{x.type}</div>
                <div className="text-xs text-gray-500">
                  {x.date.toDateString()} • {x.currency} {x.amount.toFixed(2)} → THB {x.amountTHB.toFixed(2)}
                </div>
              </div>
              <div className="font-semibold">{x.amountTHB.toFixed(2)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
