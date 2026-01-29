"use client";

import { useEffect, useState } from "react";

type Expense = {
  id: string;
  date: string;
  category: string;
  description?: string | null;
  amountTHB: number;
};

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/expenses", { cache: "no-store" });
    const json = await res.json();
    setExpenses(json.data || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Expenses</h1>

      {loading ? (
        <div className="text-sm text-zinc-500">Loading...</div>
      ) : expenses.length === 0 ? (
        <div className="rounded-xl border p-4 text-sm text-zinc-500">
          No expenses yet.
        </div>
      ) : (
        <div className="rounded-2xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 text-zinc-600">
              <tr>
                <th className="p-3 text-left">Date</th>
                <th className="p-3 text-left">Category</th>
                <th className="p-3 text-left">Description</th>
                <th className="p-3 text-right">THB</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((e) => (
                <tr key={e.id} className="border-t">
                  <td className="p-3">
                    {new Date(e.date).toISOString().slice(0, 10)}
                  </td>
                  <td className="p-3">{e.category}</td>
                  <td className="p-3 text-zinc-600">
                    {e.description || "-"}
                  </td>
                  <td className="p-3 text-right font-medium">
                    {e.amountTHB.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
