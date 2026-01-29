"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { addMonthsYM, formatMonthLabel, parseYM, ymNow } from "@/lib/date";

export default function MonthBar({ label = "Month" }: { label?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const current = useMemo(() => {
    const m = sp.get("month");
    return m && parseYM(m) ? m : ymNow();
  }, [sp]);

  const [input, setInput] = useState(current);

  function pushMonth(nextYM: string) {
    const params = new URLSearchParams(sp.toString());
    params.set("month", nextYM);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        onClick={() => pushMonth(addMonthsYM(current, -1))}
        className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10"
      >
        ← Prev
      </button>

      <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
        <div className="text-xs text-white/60">{label}</div>
        <div className="text-sm font-semibold">{formatMonthLabel(current)}</div>
      </div>

      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="YYYY-MM"
        className="w-28 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none"
      />

      <button
        onClick={() => {
          if (!parseYM(input)) return alert("Invalid month format. Use YYYY-MM");
          pushMonth(input);
        }}
        className="rounded-xl bg-white px-3 py-2 text-sm font-semibold text-black hover:opacity-90"
      >
        View
      </button>

      <button
        onClick={() => pushMonth(addMonthsYM(current, 1))}
        className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10"
      >
        Next →
      </button>
    </div>
  );
}
