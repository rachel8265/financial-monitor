import TransactionList from "../components/TransactionList";
import type { Transaction } from "../types";

type Props = {
  list: Transaction[];
  clear: () => void;
  setFilter: (f: string | null) => void;
  filter: string | null;
};

export default function Monitor({ list, clear, setFilter, filter }: Props) {
  return (
    <div className="monitor-page">
      <h2>Live Monitor</h2>
      <div className="filter-bar">
        <button className={`filter-btn${!filter ? " active" : ""}`} onClick={() => setFilter(null)}>All ({list.length})</button>
        <button className={`filter-btn${filter === "Completed" ? " active" : ""}`} onClick={() => setFilter("Completed")}>Completed</button>
        <button className={`filter-btn${filter === "Failed" ? " active" : ""}`} onClick={() => setFilter("Failed")}>Failed</button>
        <button className={`filter-btn${filter === "Pending" ? " active" : ""}`} onClick={() => setFilter("Pending")}>Pending</button>
        <button className="filter-btn clear" onClick={() => clear()}>Clear</button>
      </div>

      <div style={{ height: 600, border: "1px solid #e5e7eb", borderRadius: 8, overflow: "hidden" }}>
        <TransactionList items={list} />
      </div>
    </div>
  );
}
