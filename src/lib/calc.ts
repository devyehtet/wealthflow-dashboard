import { Prisma } from "@prisma/client";

export function calcManageFeeTHB(spendTHB: number, manageFeeType: string, percent?: Prisma.Decimal | null, fixedFee?: Prisma.Decimal | null) {
  const p = percent ? Number(percent) : 0;
  const f = fixedFee ? Number(fixedFee) : 0;

  if (manageFeeType === "FIXED") return f;
  if (manageFeeType === "HYBRID") return f + (spendTHB * p) / 100;
  // default PERCENT
  return (spendTHB * p) / 100;
}
