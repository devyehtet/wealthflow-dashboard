"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import MonthBar from "@/components/MonthBar";
import { ymNow, prettyMonth } from "@/lib/date";

type Invoice = {
  id: string;
  periodStart: string;
  periodEnd: string;
  spendTHB: number;
  manageFeeTHB: number;
  fixedFeeTHB: number;
  totalTHB: number;
  status: "UNPAID" | "PARTIAL" | "PAID";
  client: { name: string };
};

export default function InvoicesPage() {
  const sp = useSearchParams();
  const month = sp.get("month") ?? ymNow();

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/invoices?month=${month}`, {
        cache: "no-store",
      });
      const json = await res.json();
      setInvoices(json.data ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-3xl border border-white/10 bg-black/40 p-6 backdrop-blur">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="text-sm text-white/60">WealthFlow</div>
            <div className="text-3xl font-semibold">Invoices</div>
            <div className="text-sm text-white/60">
              Export invoice as PDF & send to client
            </div>
          </div>
          <MonthBar label="Month" />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-3xl border border-white/10 bg-black/40 p-6 backdrop-blur">
        <div className="mb-4 text-sm text-white/60">
          Invoices for {prettyMonth(month)}
        </div>

        {loading ? (
          <div className="text-white/60">Loading…</div>
        ) : invoices.length === 0 ? (
          <div className="text-white/60">No invoices for this month.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-white/10 text-white/60">
                <tr>
                  <th className="py-2 text-left">Client</th>
                  <th className="py-2 text-left">Period</th>
                  <th className="py-2 text-right">Total (THB)</th>
                  <th className="py-2 text-center">Status</th>
                  <th className="py-2 text-right">Export</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr
                    key={inv.id}
                    className="border-b border-white/5 hover:bg-white/5"
                  >
                    <td className="py-3">
                      <div className="font-medium">{inv.client.name}</div>
                    </td>

                    <td className="py-3 text-white/70">
                      {inv.periodStart.slice(0, 10)} →{" "}
                      {inv.periodEnd.slice(0, 10)}
                    </td>

                    <td className="py-3 text-right font-semibold">
                      {Number(inv.totalTHB).toFixed(2)}
                    </td>

                    <td className="py-3 text-center">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          inv.status === "PAID"
                            ? "bg-green-500/20 text-green-400"
                            : inv.status === "PARTIAL"
                            ? "bg-yellow-500/20 text-yellow-400"
                            : "bg-red-500/20 text-red-400"
                        }`}
                      >
                        {inv.status}
                      </span>
                    </td>

                    {/* ✅ PDF BUTTON */}
                    <td className="py-3 text-right">
                      <a
                        href={`/api/invoices/${inv.id}/pdf`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold hover:bg-white/10"
                      >
                        Download PDF
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
