"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type Client = {
  id: string;
  name: string;
  feeType: string; // "PERCENT_OF_SPEND" | "FIXED_MONTHLY" | "HYBRID" etc
  feePercent: number | string;
  fixedMonthlyTHB: number | string;
};

type Invoice = {
  id: string;
  clientId: string;
  periodStart: string;
  periodEnd: string;
  spendTHB: number | string;
  manageFeeTHB: number | string;
  fixedFeeTHB: number | string;
  totalTHB: number | string;
  status: "UNPAID" | "PARTIAL" | "PAID";
  client: { name: string };

  payments: { id: string; amountTHB: number | string; date: string; method?: string | null; note?: string | null }[];
};

function ymNow() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function addMonthsYM(ym: string, delta: number) {
  const [yStr, mStr] = ym.split("-");
  const y = Number(yStr);
  const m = Number(mStr);
  const dt = new Date(y, m - 1, 1);
  dt.setMonth(dt.getMonth() + delta);
  const yy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  return `${yy}-${mm}`;
}

function monthLabel(ym: string) {
  // simple readable label without needing extra libs
  const [y, m] = ym.split("-");
  const mm = Number(m);
  const names = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December",
  ];
  return `${names[mm - 1] ?? ym} ${y}`;
}

async function safeJson(res: Response) {
  const text = await res.text();
  if (!text) return { ok: false, error: "Empty response from server" };
  try {
    return JSON.parse(text);
  } catch (e) {
    return { ok: false, error: `Invalid JSON from server: ${String(e)} | ${text.slice(0, 160)}` };
  }
}

function n(x: any) {
  // Decimal / string / number => number
  const v = typeof x === "string" ? Number(x) : typeof x === "number" ? x : Number(x ?? 0);
  return Number.isFinite(v) ? v : 0;
}

function money(x: any) {
  return n(x).toFixed(2);
}

export default function InvoicesClient() {
  const sp = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const month = sp.get("month") ?? ymNow();

  const [clients, setClients] = useState<Client[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);

  // generate
  const [selectedClientId, setSelectedClientId] = useState("");

  // payment
  const [payInvoiceId, setPayInvoiceId] = useState("");
  const [payDate, setPayDate] = useState("");
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState("");
  const [payNote, setPayNote] = useState("");

  function setMonthTo(nextYM: string) {
    const params = new URLSearchParams(sp.toString());
    params.set("month", nextYM);
    router.push(`${pathname}?${params.toString()}`);
  }

  async function load() {
    setLoading(true);
    try {
      const [cRes, invRes] = await Promise.all([
        fetch("/api/clients", { cache: "no-store" }),
        fetch(`/api/invoices?month=${encodeURIComponent(month)}`, { cache: "no-store" }),
      ]);

      const cJson = await safeJson(cRes);
      const invJson = await safeJson(invRes);

      setClients(cJson.data ?? []);
      setInvoices(invJson.data ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month]);

  const totals = useMemo(() => {
    const total = invoices.reduce((s, i) => s + n(i.totalTHB), 0);
    const paid = invoices.reduce(
      (s, i) => s + i.payments.reduce((p, t) => p + n(t.amountTHB), 0),
      0
    );
    const outstanding = Math.max(0, total - paid);
    return { total, paid, outstanding };
  }, [invoices]);

  const invoiceOptions = useMemo(
    () =>
      invoices.map((i) => ({
        id: i.id,
        label: `${i.client?.name ?? "Client"} • ${money(i.totalTHB)} THB • ${i.status}`,
      })),
    [invoices]
  );

  async function generateInvoice() {
    if (!selectedClientId) return alert("Select client first.");
    setLoading(true);
    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ month, clientId: selectedClientId }),
      });
      const json = await safeJson(res);
      if (!json.ok) return alert(JSON.stringify(json.error ?? json));
      await load();
      alert("Invoice generated ✅");
    } finally {
      setLoading(false);
    }
  }

  async function addPayment() {
    if (!payInvoiceId) return alert("Select invoice.");
    if (!payDate) return alert("Select date.");
    if (!payAmount) return alert("Enter amount.");

    setLoading(true);
    try {
      const res = await fetch(`/api/invoices/${payInvoiceId}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: payDate,
          amountTHB: Number(payAmount),
          method: payMethod || undefined,
          note: payNote || undefined,
        }),
      });

      const json = await safeJson(res);
      if (!json.ok) return alert(JSON.stringify(json.error ?? json));

      setPayAmount("");
      setPayMethod("");
      setPayNote("");
      await load();
      alert("Payment added ✅");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-3xl border border-white/10 bg-black/40 p-6 backdrop-blur">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="text-sm text-white/60">WealthFlow</div>
            <div className="text-3xl font-semibold text-white">Invoices</div>
            <div className="text-sm text-white/60">Generate invoices + collect payments + auto status</div>
          </div>

          {/* Month controls */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setMonthTo(addMonthsYM(month, -1))}
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
            >
              ← Prev
            </button>

            <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
              <div className="text-xs text-white/60">Month</div>
              <div className="text-sm font-semibold text-white">{monthLabel(month)}</div>
            </div>

            <input
              type="month"
              value={month}
              onChange={(e) => setMonthTo(e.target.value)}
              className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none"
            />

            <button
              onClick={() => load()}
              className="rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-black hover:opacity-90"
            >
              View
            </button>

            <button
              onClick={() => setMonthTo(addMonthsYM(month, 1))}
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
            >
              Next →
            </button>
          </div>
        </div>
      </div>

      {/* Totals */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-3xl border border-white/10 bg-black/40 p-5 backdrop-blur">
          <div className="text-xs text-white/60">Total (THB)</div>
          <div className="mt-1 text-2xl font-semibold text-white">{money(totals.total)}</div>
        </div>
        <div className="rounded-3xl border border-white/10 bg-black/40 p-5 backdrop-blur">
          <div className="text-xs text-white/60">Paid (THB)</div>
          <div className="mt-1 text-2xl font-semibold text-white">{money(totals.paid)}</div>
        </div>
        <div className="rounded-3xl border border-white/10 bg-black/40 p-5 backdrop-blur">
          <div className="text-xs text-white/60">Outstanding (THB)</div>
          <div className="mt-1 text-2xl font-semibold text-white">{money(totals.outstanding)}</div>
        </div>
      </div>

      {/* Actions */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Generate */}
        <div className="rounded-3xl border border-white/10 bg-black/40 p-6 backdrop-blur">
          <div className="flex items-center justify-between">
            <div className="font-semibold text-white">Generate Invoice</div>
            <div className="text-xs text-white/60">Month: {month}</div>
          </div>

          <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_auto]">
            <select
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none"
            >
              <option value="">Select client</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} • {c.feeType} • {money(c.fixedMonthlyTHB)} THB
                </option>
              ))}
            </select>

            <button
              onClick={generateInvoice}
              disabled={loading}
              className="rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-black hover:opacity-90 disabled:opacity-60"
            >
              Generate
            </button>
          </div>

          <div className="mt-3 text-xs text-white/60">
            SpendTHB = sum(AdSpend.billedAmount within month). Fee = client rules (Percent / Fixed / Hybrid).
          </div>
        </div>

        {/* Add Payment */}
        <div className="rounded-3xl border border-white/10 bg-black/40 p-6 backdrop-blur">
          <div className="font-semibold text-white">Add Payment (Partial / Full)</div>

          <div className="mt-4 grid gap-3">
            <select
              value={payInvoiceId}
              onChange={(e) => setPayInvoiceId(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none"
            >
              <option value="">Select invoice</option>
              {invoiceOptions.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>

            <div className="grid gap-3 lg:grid-cols-3">
              <input
                type="date"
                value={payDate}
                onChange={(e) => setPayDate(e.target.value)}
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none"
              />
              <input
                placeholder="Paid THB"
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none"
              />
              <input
                placeholder="Method (Bank/Cash/...)"
                value={payMethod}
                onChange={(e) => setPayMethod(e.target.value)}
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none"
              />
            </div>

            <input
              placeholder="Note (optional)"
              value={payNote}
              onChange={(e) => setPayNote(e.target.value)}
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none"
            />

            <button
              onClick={addPayment}
              disabled={loading}
              className="rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-black hover:opacity-90 disabled:opacity-60"
            >
              Add Payment + Update Status
            </button>

            <div className="text-xs text-white/60">
              System auto-updates: UNPAID → PARTIAL → PAID (based on totalPaid vs totalTHB)
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-3xl border border-white/10 bg-black/40 p-6 backdrop-blur">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="text-lg font-semibold text-white">Invoices in {month}</div>
            <div className="text-xs text-white/60">Tip: Use Download PDF button to send to client.</div>
          </div>

          <button
            onClick={() => load()}
            className="w-fit rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
          >
            Refresh
          </button>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-[980px] w-full text-sm">
            <thead className="text-left text-white/60">
              <tr className="border-b border-white/10">
                <th className="py-3 pr-3">Client</th>
                <th className="py-3 pr-3">Period</th>
                <th className="py-3 pr-3 text-right">Spend</th>
                <th className="py-3 pr-3 text-right">Manage Fee</th>
                <th className="py-3 pr-3 text-right">Fixed</th>
                <th className="py-3 pr-3 text-right">Total</th>
                <th className="py-3 pr-3 text-right">Paid</th>
                <th className="py-3 pr-3 text-right">Outstanding</th>
                <th className="py-3 pr-3">Status</th>
                <th className="py-3 pr-3">PDF</th>
              </tr>
            </thead>
            <tbody className="text-white">
              {invoices.length === 0 ? (
                <tr>
                  <td className="py-6 text-white/60" colSpan={10}>
                    No invoices for this month.
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => {
                  const paid = inv.payments.reduce((s, p) => s + n(p.amountTHB), 0);
                  const total = n(inv.totalTHB);
                  const outstanding = Math.max(0, total - paid);

                  return (
                    <tr key={inv.id} className="border-b border-white/10">
                      <td className="py-3 pr-3 font-medium">{inv.client?.name ?? "Client"}</td>
                      <td className="py-3 pr-3 text-white/70">
                        {inv.periodStart?.slice(0, 10)} → {inv.periodEnd?.slice(0, 10)}
                      </td>
                      <td className="py-3 pr-3 text-right">{money(inv.spendTHB)}</td>
                      <td className="py-3 pr-3 text-right">{money(inv.manageFeeTHB)}</td>
                      <td className="py-3 pr-3 text-right">{money(inv.fixedFeeTHB)}</td>
                      <td className="py-3 pr-3 text-right font-semibold">{money(inv.totalTHB)}</td>
                      <td className="py-3 pr-3 text-right">{money(paid)}</td>
                      <td className="py-3 pr-3 text-right">{money(outstanding)}</td>
                      <td className="py-3 pr-3">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                            inv.status === "PAID"
                              ? "bg-emerald-500/20 text-emerald-200"
                              : inv.status === "PARTIAL"
                              ? "bg-yellow-500/20 text-yellow-200"
                              : "bg-red-500/20 text-red-200"
                          }`}
                        >
                          {inv.status}
                        </span>
                      </td>
                      <td className="py-3 pr-3">
                        <a
                          href={`/api/invoices/${inv.id}/pdf`}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold hover:bg-white/10"
                        >
                          Download PDF
                        </a>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom links */}
      <div className="flex flex-wrap gap-2">
        <Link
          href="/dashboard"
          className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
        >
          ← Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
