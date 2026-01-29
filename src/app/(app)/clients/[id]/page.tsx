import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

export default async function ClientDetail({ params }: { params: { id: string } }) {
  const client = await prisma.client.findUnique({
    where: { id: params.id },
    include: { sources: true },
  });
  if (!client) return notFound();

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">{client.name}</h1>

      <form action="/api/ad-sources" method="POST" className="rounded-2xl border p-4 grid gap-3 md:grid-cols-4">
        <input type="hidden" name="clientId" value={client.id} />
        <select name="type" className="rounded-xl border p-3" defaultValue="page">
          <option value="page">page</option>
          <option value="ad_account">ad_account</option>
        </select>
        <input name="name" placeholder="Page name / Ad account name" className="rounded-xl border p-3" required />
        <input name="notes" placeholder="Notes (optional)" className="rounded-xl border p-3" />
        <button className="rounded-xl border p-3 hover:bg-black hover:text-white md:col-span-4">
          Add Source
        </button>
      </form>

      <div className="rounded-2xl border overflow-hidden">
        <div className="p-3 text-sm text-gray-600 border-b">Sources</div>
        <div className="divide-y">
          {client.sources.map((s) => (
            <div key={s.id} className="p-3 text-sm flex justify-between">
              <div>
                <div className="font-medium">{s.name}</div>
                <div className="text-xs text-gray-500">{s.type}{s.notes ? ` • ${s.notes}` : ""}</div>
              </div>
              <div className="text-xs text-gray-400">{s.id.slice(0, 6)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
