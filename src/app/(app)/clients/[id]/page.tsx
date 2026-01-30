// src/app/(app)/clients/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

/* -------------------- Types -------------------- */

type ApiOk<T> = { ok: true; data: T };
type ApiErr = { ok: false; error?: any };

type ClientSource = {
  id: string;
  name: string;
  platform?: string | null;
};

type Client = {
  id: string;
  name: string;
  feeType: "PERCENT_OF_SPEND" | "FIXED_MONTHLY" | "HYBRID" | string;
  feePercent: number | string;
  fixedMonthlyTHB: number | string;
  sources: ClientSource[];
};

/* -------------------- Utils -------------------- */

// Prisma Decimal safe number
function n(v: unknown): number {
  if (v === null || v === undefined) return 0;
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  const num = Number(String(v));
  return Number.isFinite(num) ? num : 0;
}

/* -------------------- Page -------------------- */

export default function ClientDetailPage() {
  const params = useParams<{ id: string }>();
  const clientId = params?.id;

  const [loading, setLoading] = useState(false);
  const [client, setClient] = useState<Client | null>(null);
  const [error, setError] = useState<string>("");

  async function loadClient() {
    if (!clientId) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/clients/${clientId}`, {
        cache: "no-store",
      });

      const text = await res.text();
      const json = (text ? JSON.parse(text) : null) as ApiOk<Client> | ApiErr | null;

      if (!json || (json as ApiErr).ok === false) {
        setClient(null);
        setError(JSON.stringify((json as ApiErr)?.error ?? json ?? "Unknown error"));
        return;
      }

      setClient((json as ApiOk<Client>).data ?? null);
    } catch (e: any) {
      setClient(null);
      setError(e?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadClient();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  /* -------------------- UI -------------------- */

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-3xl border border-white/10 bg-black/40 p-6 backdrop-blur">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-sm text-white/60">WealthFlow</div>
            <div className="text-3xl font-semibold text-white">Client Detail</div>
            <div className="text-sm text-white/60">
              Client profile, fee structure & sources
            </div>
          </div>

          <button
            onClick={loadClient}
            disabled={loading}
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 disabled:opacity-60"
          >
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>

        {error ? (
          <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
            <div className="font-semibold">API Error</div>
            <div className="mt-1 break-all text-xs text-red-200/80">
              {error}
            </div>
          </div>
        ) : null}
      </div>

      {/* Client Info */}
      <div className="rounded-3xl border border-white/10 bg-black/40 p-6 backdrop-blur">
        {!client ? (
          <div className="py-12 text-center text-white/60">
            {loading ? "Loading client..." : "Client not found."}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid gap-4 lg:grid-cols-3">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <div className="text-sm text-white/60">Client Name</div>
                <div className="mt-1 text-2xl font-semibold text-white">
                  {client.name}
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <div className="text-sm text-white/60">Fee Type</div>
                <div className="mt-1 text-2xl font-semibold text-white">
                  {client.feeType}
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <div className="text-sm text-white/60">Fee</div>
                <div className="mt-1 text-xl font-semibold text-white">
                  {n(client.feePercent).toFixed(2)}% •{" "}
                  {n(client.fixedMonthlyTHB).toFixed(2)} THB
                </div>
              </div>
            </div>

            {/* Sources */}
            <div className="rounded-3xl border border-white/10 bg-white/5">
              <div className="p-3 text-sm text-white/60 border-b border-white/10">
                Sources
              </div>

              <div className="divide-y divide-white/10">
                {client.sources && client.sources.length > 0 ? (
                  client.sources.map((s: ClientSource) => (
                    <div
                      key={s.id}
                      className="p-3 text-sm flex items-center justify-between"
                    >
                      <div>
                        <div className="font-medium text-white">
                          {s.name}
                        </div>
                        {s.platform ? (
                          <div className="text-xs text-white/50">
                            {s.platform}
                          </div>
                        ) : null}
                      </div>

                      <div className="text-xs text-white/40">
                        {s.id}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-sm text-white/50">
                    No sources added yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
