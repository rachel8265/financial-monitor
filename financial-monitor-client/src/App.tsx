import { useEffect } from 'react';
import './App.css'
import { Routes, Route, Link } from "react-router-dom";
import Monitor from './pages/Monitor';
import Add from './pages/Add';
import { createConnection } from './services/socket';
import { fetchTransactions } from './services/api';
import useTransactions from './store/useTransactions';

function App() {
  const { addTransaction, loadTransactions, list, clear, setFilter, filter } = useTransactions();

  useEffect(() => {
    // 1. Load existing transactions, THEN connect SignalR
    //    (avoids race condition where SignalR delivers items before GET returns)
    fetchTransactions()
      .then((items) => {
        loadTransactions(items);
        // 2. Only now connect to SignalR for real-time updates
        createConnection((t) => addTransaction(t));
      })
      .catch((err) => console.error("Failed to load transactions:", err));
  }, []);

  return (
    <div>
      <header className="nav-header">
        <Link to="/add">Simulator</Link>
        <Link to="/monitor">Live Monitor</Link>
      </header>

      <Routes>
        <Route path="/" element={<Add />} />
        <Route path="/add" element={<Add />} />
        <Route path="/monitor" element={
          <Monitor
            list={list}
            clear={clear}
            setFilter={setFilter}
            filter={filter}
          />
        } />
      </Routes>
    </div>
  );
}

export default App
