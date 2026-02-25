import * as signalR from "@microsoft/signalr";
import type { Transaction } from "../types";

const HUB_URL = "http://localhost:5227/hub/monitor";

const STATUS_MAP: Record<number, string> = {
  0: "Pending",
  1: "Completed",
  2: "Failed",
};

function normalizeTransaction(data: any): Transaction {
  return {
    transactionId: data.transactionId ?? data.TransactionId ?? "",
    amount: data.amount ?? data.Amount ?? 0,
    currency: data.currency ?? data.Currency ?? "USD",
    status:
      typeof data.status === "number"
        ? STATUS_MAP[data.status] ?? "Unknown"
        : typeof data.Status === "number"
          ? STATUS_MAP[data.Status] ?? "Unknown"
          : data.status ?? data.Status ?? "Unknown",
    timestamp: data.timestamp ?? data.Timestamp ?? new Date().toISOString(),
  };
}

let conn: signalR.HubConnection | null = null;

let callbackRef: ((t: Transaction) => void) | null = null;

export function createConnection(onTransaction: (t: Transaction) => void) {
  callbackRef = onTransaction;

  if (conn && conn.state !== signalR.HubConnectionState.Disconnected) {
    return conn;
  }

  if (conn) {
    conn.stop().catch(() => {});
    conn = null;
  }

  const hub = new signalR.HubConnectionBuilder()
    .withUrl(HUB_URL)
    .withAutomaticReconnect()
    .configureLogging(signalR.LogLevel.Warning)
    .build();

  conn = hub;

  hub.on("transactionReceived", (raw: any) => {
    const tx = normalizeTransaction(raw);
    if (callbackRef) callbackRef(tx);
  });

  hub
    .start()
    .then(() => console.log("SignalR connected"))
    .catch((err) => {
      if (conn === hub) {
        console.error("SignalR start failed:", err);
      }
    });

  return hub;
}

export function stopConnection() {
  callbackRef = null;
  if (conn) {
    conn.stop().catch(() => {});
    conn = null;
  }
}
