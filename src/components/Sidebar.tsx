"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const nav = [
  { label: "Dashboard", href: "/dashboard", icon: "🏠" },
  { label: "Expenses", href: "/expenses", icon: "🧾" },
  { label: "Ads Finance", href: "/ads", icon: "📣" },
  { label: "Training", href: "/training", icon: "🎓" },

  // ✅ ADD THIS
  { label: "Invoices", href: "/invoices", icon: "🧾" },

  { label: "Monthly Report", href: "/reports/monthly", icon: "📊" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-[260px] shrink-0 space-y-3 p-4">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
        <div className="text-sm font-semibold text-white">WealthFlow</div>
        <div className="text-xs text-white/60">Money + Ads + Training</div>
      </div>

      <nav className="space-y-1">
        {nav.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(item.href + "/");

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition
                ${
                  active
                    ? "bg-white text-black"
                    : "text-white/80 hover:bg-white/10"
                }`}
            >
              <span className="text-base">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
