import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function n(v: any) {
  if (v == null) return 0;
  if (typeof v === "number") return v;
  if (typeof v === "string") return Number(v);
  if (typeof v === "object" && typeof v.toString === "function") {
    return Number(v.toString());
  }
  return 0;
}

export default async function ClientsPage() {
  const clients = await prisma.client.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-3xl border border-white/10 bg-black/40 p-6 backdrop-blur">
        <div className="text-sm text-white/60">WealthFlow</div>
        <div className="text-3xl font-semibold text-white">Clients</div>
        <div className="text-sm text-white/60">
          Fee rules • Monthly retainers • Management %
        </div>
      </div>

      {/* Client list */}
      <div className="grid gap-4">
        {clients.length === 0 && (
          <div className="rounded-2xl border border-white/10 bg-black/40 p-6 text-sm text-white/60">
            No clients yet.
          </div>
        )}

        {clients.map((c) => (
          <div
            key={c.id}
            className="rounded-2xl border border-white/10 bg-black/40 p-5 backdrop-blur"
          >
            <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="font-medium text-white">{c.name}</div>
                <div className="text-xs text-white/60">
                  {c.feeType} • {n(c.feePercent)}% • Fixed{" "}
                  {n(c.fixedMonthlyTHB).toFixed(2)} THB
                </div>
              </div>

              <div className="flex items-center gap-3 text-xs text-white/60">
                <div>
                  Created:{" "}
                  {new Date(c.createdAt).toISOString().slice(0, 10)}
                </div>
                <div>
                  Updated:{" "}
                  {new Date(c.updatedAt).toISOString().slice(0, 10)}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
