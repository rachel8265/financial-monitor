import { useState } from "react";
import { v4 as uuid } from "uuid";
import { sendTransaction } from "../services/api";
import type { Transaction } from "../types";

const statuses = ["Completed", "Failed", "Pending"];
const currencies = ["USD", "EUR", "GBP", "ILS"];

export default function Add() {
  const [amount, setAmount] = useState(10);
  const [currency, setCurrency] = useState("USD");
  const [status, setStatus] = useState("Completed");
  const [lastMsg, setLastMsg] = useState<string | null>(null);

  async function postOne(dto: Transaction) {
    try {
      await sendTransaction(dto);
      setLastMsg("Sent: " + dto.transactionId);
    } catch (e: any) {
      setLastMsg("Error: " + e.message);
    }
  }

  function generateAndSend() {
    const dto: Transaction = {
      transactionId: uuid(),
      amount: Number(amount),
      currency,
      status,
      timestamp: new Date().toISOString(),
    };
    void postOne(dto);
  }

  async function generateMany(count = 100) {
    setLastMsg(`Dispatching ${count}...`);
    for (let i = 0; i < count; i++) {
      const dto: Transaction = {
        transactionId: uuid(),
        amount: Math.round(Math.random() * 10000 * 100) / 100,
        currency: currencies[Math.floor(Math.random() * currencies.length)],
        status: statuses[Math.floor(Math.random() * statuses.length)],
        timestamp: new Date().toISOString(),
      };
      sendTransaction(dto).catch(() => {});
    }
    setLastMsg(`Dispatched ${count} transactions`);
  }

  return (
    <div className="add-page">
      <h2>Transaction Simulator</h2>

      <div className="form-grid">
        <div className="form-field">
          <label>Amount</label>
          <input type="number" value={amount} onChange={e => setAmount(Number(e.target.value))} />
        </div>
        <div className="form-field">
          <label>Currency</label>
          <select value={currency} onChange={e => setCurrency(e.target.value)}>
            {currencies.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="form-field">
          <label>Status</label>
          <select value={status} onChange={e => setStatus(e.target.value)}>
            {statuses.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div className="btn-row">
        <button className="btn btn-primary" onClick={generateAndSend}>Send One</button>
        <button className="btn btn-secondary" onClick={() => generateMany(100)}>Generate 100</button>
      </div>

      <div className="status-msg">{lastMsg}</div>
    </div>
  );
}