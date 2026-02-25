export type Transaction = {
  transactionId: string;
  amount: number;
  currency: string;
  status: string; // "Pending" | "Completed" | "Failed"
  timestamp: string; // ISO 8601
};