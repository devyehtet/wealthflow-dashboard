// src/lib/invoicePdf.tsx
import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

// ---------- Types ----------
export type InvoicePdfLine = {
  description: string;
  amountUSD?: number | null;
  amountTHB?: number | null;
};

export type InvoicePdfData = {
  invoiceNo: string;            // e.g. "000 3127" or your invoice id short
  invoiceDate: string;          // e.g. "2026-01-29" or "1/4/2026"

  fromName: string;             // e.g. "Ye Htet - Digital"
  fromAddress: string;          // e.g. "333/64 The Urbana 2 Chiang Mai"
  fromEmail: string;            // e.g. "info@yehtet.com"

  billToName: string;           // client name
  billToAddress?: string;       // client city/country optional

  forText?: string;             // e.g. "Media Buying"
  periodText?: string;          // e.g. "2026-01-01 — 2026-02-01"

  lines: InvoicePdfLine[];

  totalUSD?: number;            // optional
  totalTHB: number;

  paymentTerms?: string;        // e.g. "Full Payment Must be Paid"
};

// ---------- Helpers ----------
function n(v: any): number {
  // supports Prisma Decimal (toNumber) OR normal number/string
  if (v == null) return 0;
  if (typeof v === "number") return v;
  if (typeof v === "string") return Number(v) || 0;
  if (typeof v === "object" && typeof v.toNumber === "function") return v.toNumber();
  if (typeof v === "object" && typeof v.toString === "function") return Number(v.toString()) || 0;
  return 0;
}

function fmtMoney(v: any, digits = 2) {
  const num = n(v);
  return num.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

// ---------- Component ----------
export function InvoicePDF({ data }: { data: InvoicePdfData }) {
  const totalUSD =
    data.totalUSD != null
      ? n(data.totalUSD)
      : data.lines.reduce((sum, l) => sum + n(l.amountUSD), 0);

  const totalTHB =
    data.totalTHB != null
      ? n(data.totalTHB)
      : data.lines.reduce((sum, l) => sum + n(l.amountTHB), 0);

  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* Header */}
        <View style={s.headerRow}>
          <View style={s.headerLeft}>
            <Text style={s.brandName}>{data.fromName}</Text>
            <Text style={s.subText}>{data.fromAddress}</Text>
            <Text style={s.subText}>{data.fromEmail}</Text>
          </View>

          <View style={s.headerRight}>
            <Text style={s.invoiceTitle}>Invoice</Text>

            <View style={s.metaRow}>
              <Text style={s.metaLabel}>Invoice</Text>
              <Text style={s.metaValue}>{data.invoiceNo}</Text>
            </View>

            <View style={s.metaRow}>
              <Text style={s.metaLabel}>Date</Text>
              <Text style={s.metaValue}>{data.invoiceDate}</Text>
            </View>
          </View>
        </View>

        {/* Bill To / For */}
        <View style={s.infoRow}>
          <View style={s.billBox}>
            <Text style={s.infoLabel}>Bill to</Text>
            <Text style={s.infoValue}>{data.billToName}</Text>
            {!!data.billToAddress && <Text style={s.subText}>{data.billToAddress}</Text>}
            {!!data.periodText && <Text style={s.subText}>Period: {data.periodText}</Text>}
          </View>

          <View style={s.forBox}>
            <Text style={s.infoLabel}>For</Text>
            <Text style={s.infoValue}>{data.forText || "Service"}</Text>
          </View>
        </View>

        {/* Table Header */}
        <View style={s.tableHeader}>
          <Text style={[s.thCell, s.colDesc]}>Description</Text>
          <Text style={[s.thCell, s.colUSD]}>AMOUNT USD</Text>
          <Text style={[s.thCell, s.colTHB]}>AMOUNT THB</Text>
        </View>

        {/* Table Rows */}
        <View style={s.tableBody}>
          {data.lines.map((line, idx) => (
            <View key={idx} style={s.tr}>
              <Text style={[s.tdCell, s.colDesc]}>{line.description}</Text>
              <Text style={[s.tdCell, s.colUSD]}>
                {n(line.amountUSD) ? `$${fmtMoney(line.amountUSD)}` : ""}
              </Text>
              <Text style={[s.tdCell, s.colTHB]}>
                {n(line.amountTHB) ? fmtMoney(line.amountTHB) : ""}
              </Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={s.totalsWrap}>
          <View style={s.totalRow}>
            <Text style={s.totalLabel}>Total USD $</Text>
            <Text style={s.totalValue}>{`$${fmtMoney(totalUSD)}`}</Text>
          </View>
          <View style={s.totalRow}>
            <Text style={s.totalLabel}>Total THB</Text>
            <Text style={s.totalValue}>{`฿${fmtMoney(totalTHB)}`}</Text>
          </View>
        </View>

        {/* Payment Terms */}
        <View style={s.termsWrap}>
          <Text style={s.termsTitle}>Payment Terms</Text>
          <Text style={s.termsText}>{data.paymentTerms || "Full Payment Must be Paid"}</Text>
        </View>

        {/* Footer line */}
        <View style={s.footerLine} />
      </Page>
    </Document>
  );
}

// ---------- Styles (Google Sheet vibe) ----------
const s = StyleSheet.create({
  page: { padding: 36, fontSize: 11, color: "#111" },

  headerRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 18 },
  headerLeft: { width: "60%" },
  headerRight: { width: "40%", alignItems: "flex-end" },

  brandName: { fontSize: 22, fontWeight: 700, marginBottom: 4 },
  subText: { fontSize: 10, color: "#444", marginTop: 2 },

  invoiceTitle: { fontSize: 16, fontWeight: 700, marginBottom: 8 },

  metaRow: { flexDirection: "row", gap: 10, marginTop: 2 },
  metaLabel: { fontSize: 10, color: "#333" },
  metaValue: { fontSize: 10, fontWeight: 700 },

  infoRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 14, marginTop: 6 },
  billBox: { width: "55%" },
  forBox: { width: "40%" },

  infoLabel: { fontSize: 10, color: "#444", marginBottom: 3 },
  infoValue: { fontSize: 12, fontWeight: 700 },

  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#2f2f2f",
    color: "#fff",
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginTop: 6,
  },
  thCell: { fontSize: 10, fontWeight: 700 },

  tableBody: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: "#e5e5e5",
  },
  tr: {
    flexDirection: "row",
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderColor: "#efefef",
  },
  tdCell: { fontSize: 11 },

  colDesc: { width: "55%" },
  colUSD: { width: "20%", textAlign: "right" },
  colTHB: { width: "25%", textAlign: "right" },

  totalsWrap: {
    marginTop: 18,
    marginLeft: "35%",
    borderWidth: 1,
    borderColor: "#bdbdbd",
    backgroundColor: "#d9d9d9",
  },
  totalRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 10, paddingHorizontal: 12 },
  totalLabel: { fontSize: 11, fontWeight: 700 },
  totalValue: { fontSize: 11, fontWeight: 700 },

  termsWrap: { marginTop: 26, alignItems: "center" },
  termsTitle: { fontSize: 11, color: "#c61f1f", fontWeight: 700, marginBottom: 4 },
  termsText: { fontSize: 11, color: "#c61f1f" },

  footerLine: { marginTop: 22, height: 1, backgroundColor: "#222", opacity: 0.35 },
});
