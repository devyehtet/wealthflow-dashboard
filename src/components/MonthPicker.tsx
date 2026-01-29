"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

function shiftMonth(ym: string, diff: number) {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(y, m - 1 + diff, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default function MonthPicker() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const current =
    sp.get("month") ??
    `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;

  const prev = shiftMonth(current, -1);
  const next = shiftMonth(current, 1);

  const go = (month: string) => {
    // keep other params if any
    const params = new URLSearchParams(sp.toString());
    params.set("month", month);

    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    router.refresh();
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button onClick={() => go(prev)} className="rounded-xl border px-3 py-2 text-sm">
        ← {prev}
      </button>

      <div className="flex items-center gap-2 rounded-xl border px-3 py-2">
        <span className="text-sm font-medium">Month</span>
        <input
          type="month"
          value={current}
          onChange={(e) => go(e.target.value)}
          className="bg-transparent text-sm outline-none"
        />
      </div>

      <button onClick={() => go(current)} className="rounded-xl bg-black px-4 py-2 text-sm text-white">
        View
      </button>

      <button onClick={() => go(next)} className="rounded-xl border px-3 py-2 text-sm">
        {next} →
      </button>
    </div>
  );
}
