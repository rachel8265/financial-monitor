import type { Transaction } from "../types";

const baseUrl = "http://localhost:5227";

export async function sendTransaction(dto: Transaction) {
  const res = await fetch(`${baseUrl}/api/transactions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed: ${res.status} ${text}`);
  }
}

/** Fetch all existing transactions from the server */
export async function fetchTransactions(): Promise<Transaction[]> {
  const res = await fetch(`${baseUrl}/api/transactions`);
  if (!res.ok) {
    throw new Error(`GET failed: ${res.status}`);
  }
  const data: any[] = await res.json();
  return data.map((d) => ({
    transactionId: d.transactionId ?? d.TransactionId ?? "",
    amount: d.amount ?? d.Amount ?? 0,
    currency: d.currency ?? d.Currency ?? "USD",
    status: d.status ?? d.Status ?? "Unknown",
    timestamp: d.timestamp ?? d.Timestamp ?? "",
  }));
}