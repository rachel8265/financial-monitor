import type { Transaction } from "../types";

function statusColor(s: string) {
  const lower = s.toLowerCase();
  if (lower === "completed" || lower === "success") return "#d4edda";
  if (lower === "failed") return "#f8d7da";
  if (lower === "pending") return "#fff3cd";
  return "#eee";
}

function statusBadgeColor(s: string) {
  const lower = s.toLowerCase();
  if (lower === "completed" || lower === "success") return "#15803d";
  if (lower === "failed") return "#dc2626";
  if (lower === "pending") return "#b45309";
  return "#666";
}

export default function TransactionRow({ tx }: { tx: Transaction }) {
  return (
    <div className="tx-row" style={{
      background: statusColor(tx.status),
      transition: "background 300ms ease"
    }}>
      <div className="tx-row-inner" style={{
        display: "flex",
        alignItems: "center",
        padding: "8px 12px",
        borderBottom: "1px solid #f0f0f0",
      }}>
        <div style={{ flex: "0 0 220px", fontSize: 13, color: "#555" }}>{tx.transactionId}</div>
        <div style={{ flex: "0 0 120px", fontWeight: 500 }}>{tx.amount.toFixed(2)} {tx.currency}</div>
        <div style={{ flex: "1 1 auto", fontSize: 13, color: "#666" }}>{new Date(tx.timestamp).toLocaleString()}</div>
        <div style={{
          width: 90,
          textAlign: "right",
          fontWeight: 600,
          fontSize: "0.8rem",
          color: statusBadgeColor(tx.status)
        }}>{tx.status}</div>
      </div>
    </div>
  );
}