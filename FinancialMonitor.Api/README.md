# Financial Monitor — Real-Time Transaction Dashboard

## Overview
A real-time financial monitoring system that accepts transaction data via REST API,
stores it in memory, and broadcasts updates to connected clients using SignalR.

## Tech Stack
- **Backend:** .NET 9, ASP.NET Core, SignalR
- **Frontend:** React 18, TypeScript, Vite
- **Real-Time:** SignalR (WebSocket)
- **Storage:** In-Memory (ConcurrentQueue — thread-safe)

## Architecture

`
Client (React)                    Server (.NET)
┌───────────────┐                ┌──────────────────────┐
│  /add         │──POST /api/──► │ TransactionEndpoints  │
│  (Simulator)  │   transactions │    │                  │
└───────────────┘                │    ▼                  │
                                 │ TransactionStore      │
┌───────────────┐                │ (ConcurrentQueue)     │
│  /monitor     │◄──SignalR────  │    │                  │
│  (Dashboard)  │  WebSocket     │    ▼                  │
└───────────────┘                │ MonitorHub (SignalR)   │
                                 └──────────────────────┘
`

## API Endpoints
- `POST /api/transactions` — Ingest a new transaction
- `GET /api/transactions` — Retrieve all stored transactions
- `/hub/monitor` — SignalR hub for real-time updates

## Data Model
`json
{
  "transactionId": "guid-string",
  "amount": 1500.00,
  "currency": "USD",
  "status": "Pending | Completed | Failed",
  "timestamp": "2024-01-15T10:00:00Z"
}
`

## Running Locally
`ash
dotnet run
# Server starts on http://localhost:5227
`

## Running Tests
`ash
cd ../FinancialMonitor.Tests
dotnet test
`

---

## Architecture Decision Record (ADR)

### Problem: Multi-Pod Synchronization

When deploying to Kubernetes with multiple replicas (e.g., 5 pods),
each pod has its own in-memory store and SignalR hub.

**The problem:**
- A client connected to **Pod A** sends a POST → Pod A stores it and broadcasts via SignalR
- A client connected to **Pod B** never sees that transaction
- Each pod is isolated — no shared memory, no shared SignalR connections

`
        Client 1 ──► Pod A (has tx1, tx2, tx3)
        Client 2 ──► Pod B (has tx4, tx5)        ← Client 2 can't see tx1-tx3!
        Client 3 ──► Pod C (empty)                ← Client 3 sees nothing!
`

### Solution: Redis Backplane + Shared Storage

`
                    ┌──────────────────┐
                    │   Redis PubSub   │
                    │   (Backplane)    │
                    └──┬───┬───┬───┬──┘
                       │   │   │   │
              ┌────────┘   │   │   └────────┐
              ▼            ▼   ▼            ▼
         ┌─────────┐ ┌─────────┐      ┌─────────┐
         │  Pod A  │ │  Pod B  │ ...  │  Pod N  │
         │ SignalR │ │ SignalR │      │ SignalR │
         └────┬────┘ └────┬────┘      └────┬────┘
              │            │                │
              └────────────┼────────────────┘
                           ▼
                    ┌──────────────┐
                    │  Redis/SQL   │
                    │  (Shared DB) │
                    └──────────────┘
`

#### Step 1: SignalR Redis Backplane
`csharp
// Program.cs
builder.Services.AddSignalR()
    .AddStackExchangexxxxxxxxxxxctionString, options =>
    {
        options.Configuration.ChannelPrefix = "FinancialMonitor";
    });
`
When Pod A broadcasts a SignalR message, Redis forwards it to **all pods**.
Every connected client receives the update, regardless of which pod they're on.

#### Step 2: Shared Data Store
Replace `ConcurrentQueue` with a shared store:
- **Redis** (fast, ideal for real-time) or
- **PostgreSQL/SQL Server** (durable, queryable)

`csharp
// Replace in-memory store with Redis
public class RedisTransactionStore : ITransactionStore
{
    private readonly IDatabase _redis;
    public void Add(Transaction t) => _redis.ListLeftPush("transactions", Serialize(t));
    public IReadOnlyCollection<Transaction> GetAll() => _redis.ListRange("transactions")...;
}
`

#### Step 3: Kubernetes Configuration
`yaml
# Add Redis to the cluster
apiVersion: apps/v1
kind: Deployment
metadata:
  name: redis
spec:
  replicas: 1
  template:
    spec:
      containers:
        - name: redis
          image: redis:7-alpine
          ports:
            - containerPort: 6379
`

### Why Redis?
| Approach | Pros | Cons |
|----------|------|------|
| **Redis Backplane** | Simple, built-in SignalR support | Requires Redis instance |
| **Sticky Sessions** | No code changes | Doesn't solve data consistency |
| **Database polling** | Simple | High latency, not real-time |
| **Message Queue (RabbitMQ)** | Decoupled | More complex infrastructure |

**Chosen: Redis** — minimal code changes, built-in .NET support, real-time performance.
