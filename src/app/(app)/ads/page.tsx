// src/app/(app)/ads/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import MonthBar from "@/components/MonthBar";
import { useSearchParams } from "next/navigation";
import { ymNow } from "@/lib/date";

type ApiOk<T> = { ok: true; data: T };
type ApiErr = { ok: false; error?: any };

type AdSpend = {
  id: string;
  date: string; // ISO
  client?: string | null;
  page?: string | null;
  source?: string | null; // optional
  platform?: string | null;
  spendUSD: number | string; // prisma Decimal maybe string
  rate: number | string; // THB rate
  billedTHB: number | string; // computed or stored
  note?: string | null;
  createdAt?: string;
};

function n(v: unknown): number {
  // Prisma Decimal can come as string in JSON
  if (v === null || v === undefined) return 0;
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  const s = String(v).trim();
  const num = Number(s);
  return Number.isFinite(num) ? num : 0;
}

function fmt2(v: unknown) {
  return n(v).toFixed(2);
}

function dShort(iso: string) {
  // yyyy-mm-dd
  try {
    return new Date(iso).toISOString().slice(0, 10);
  } catch {
    return iso?.slice(0, 10) ?? "";
  }
}

export default function AdsPage() {
  const sp = useSearchParams();
  const month = sp.get("month") ?? ymNow();

  // ✅ If your API path is different, change here:
  const API_URL = `/api/adspend?month=${encodeURIComponent(month)}`;

  const [loading, setLoading] = useState(false);
  const [spends, setSpends] = useState<AdSpend[]>([]);
  const [err, setErr] = useState<string>("");

  async function load() {
    setLoading(true);
    setErr("");
    try {
      const res = await fetch(API_URL, { cache: "no-store" });
      const text = await res.text(); // protect against empty JSON
      const json = (text ? JSON.parse(text) : null) as ApiOk<AdSpend[]> | ApiErr | null;

      if (!json || (json as ApiErr).ok === false) {
        setSpends([]);
        setErr(JSON.stringify((json as ApiErr)?.error ?? json ?? { error: "No response" }));
        return;
      }

      setSpends((json as ApiOk<AdSpend[]>).data ?? []);
    } catch (e: any) {
      setSpends([]);
      setErr(e?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month]);

  // ✅ FIX: no implicit any + safer totals
  const totals = useMemo(() => {
    const totalUSD = spends.reduce<number>((sum, x) => sum + n(x.spendUSD), 0);
    const totalTHB = spends.reduce<number>((sum, x) => sum + n(x.billedTHB), 0);
    const avgRate = totalUSD > 0 ? totalTHB / totalUSD : 0;
    return { totalUSD, totalTHB, avgRate };
  }, [spends]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-3xl border border-white/10 bg-black/40 p-6 backdrop-blur">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="text-sm text-white/60">WealthFlow</div>
            <div className="text-3xl font-semibold text-white">Ads Finance</div>
            <div className="text-sm text-white/60">
              Track USD spend → THB billed (Facebook / Google / TikTok / Viber / Consulting)
            </div>
          </div>
          <MonthBar label="Month" />
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <div className="text-sm text-white/60">Total Spend (USD)</div>
            <div className="mt-1 text-3xl font-semibold text-white">{totals.totalUSD.toFixed(2)}</div>
            <div className="mt-1 text-xs text-white/50">This month</div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <div className="text-sm text-white/60">Total Billed (THB)</div>
            <div className="mt-1 text-3xl font-semibold text-white">{totals.totalTHB.toFixed(2)}</div>
            <div className="mt-1 text-xs text-white/50">USD × rate (sum)</div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <div className="text-sm text-white/60">Avg Rate</div>
            <div className="mt-1 text-3xl font-semibold text-white">{totals.avgRate.toFixed(4)}</div>
            <div className="mt-1 text-xs text-white/50">TotalTHB / TotalUSD</div>
          </div>
        </div>

        {err ? (
          <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
            <div className="font-semibold">API Error</div>
            <div className="mt-1 break-all text-xs text-red-200/80">{err}</div>
          </div>
        ) : null}
      </div>

      {/* Table */}
      <div className="rounded-3xl border border-white/10 bg-black/40 p-6 backdrop-blur">
        <div className="flex items-center justify-between">
          <div className="font-semibold text-white">Ad Spend Records ({month})</div>
          <button
            onClick={load}
            disabled={loading}
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 disabled:opacity-60"
          >
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-xs text-white/60">
              <tr className="border-b border-white/10">
                <th className="py-3 pr-4">Date</th>
                <th className="py-3 pr-4">Client</th>
                <th className="py-3 pr-4">Page</th>
                <th className="py-3 pr-4">Platform</th>
                <th className="py-3 pr-4">Spend (USD)</th>
                <th className="py-3 pr-4">Rate</th>
                <th className="py-3 pr-4">Billed (THB)</th>
                <th className="py-3 pr-0">Note</th>
              </tr>
            </thead>

            <tbody className="text-white">
              {spends.length === 0 ? (
                <tr className="border-b border-white/5">
                  <td colSpan={8} className="py-10 text-center text-white/50">
                    No ad spend records for this month.
                  </td>
                </tr>
              ) : (
                spends.map((x) => (
                  <tr key={x.id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="py-3 pr-4 whitespace-nowrap">{dShort(x.date)}</td>
                    <td className="py-3 pr-4">{x.client ?? "-"}</td>
                    <td className="py-3 pr-4">{x.page ?? "-"}</td>
                    <td className="py-3 pr-4">{x.platform ?? "-"}</td>
                    <td className="py-3 pr-4 tabular-nums">{fmt2(x.spendUSD)}</td>
                    <td className="py-3 pr-4 tabular-nums">{fmt2(x.rate)}</td>
                    <td className="py-3 pr-4 tabular-nums font-semibold">{fmt2(x.billedTHB)}</td>
                    <td className="py-3 pr-0 text-white/70">{x.note ?? ""}</td>
                  </tr>
                ))
              )}
            </tbody>

            {spends.length > 0 ? (
              <tfoot>
                <tr className="border-t border-white/10">
                  <td className="py-3 pr-4 text-white/60" colSpan={4}>
                    Total
                  </td>
                  <td className="py-3 pr-4 tabular-nums font-semibold">{totals.totalUSD.toFixed(2)}</td>
                  <td className="py-3 pr-4 text-white/60 tabular-nums">{totals.avgRate.toFixed(4)}</td>
                  <td className="py-3 pr-4 tabular-nums font-semibold">{totals.totalTHB.toFixed(2)}</td>
                  <td className="py-3 pr-0" />
                </tr>
              </tfoot>
            ) : null}
          </table>
        </div>

        <div className="mt-3 text-xs text-white/50">
          Tip: If Prisma returns Decimal as string, this page safely converts it using Number().
        </div>
      </div>
    </div>
  );
}
