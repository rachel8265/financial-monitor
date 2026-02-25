# Financial Monitor API — Real-Time Transaction Backend

## Overview

A real-time financial monitoring backend built with **.NET 9** and **SignalR**.  
Accepts transactions via REST API, stores them in-memory, and broadcasts updates to all connected clients in real time.

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Runtime** | .NET 9, ASP.NET Core Minimal API |
| **Real-Time** | SignalR (WebSocket) |
| **Storage** | In-Memory (`ConcurrentQueue` — thread-safe) |
| **Containerization** | Docker (multi-stage, Alpine-based) |
| **Orchestration** | Kubernetes |

## Project Structure

```
FinancialMonitor.Api/
├── Program.cs                          # App entry point & DI configuration
├── Contracts/
│   └── TransactionDto.cs               # Incoming request DTO
├── Models/
│   └── Transaction.cs                  # Domain model + TransactionStatus enum
├── Services/
│   ├── Interfaces/
│   │   └── ITransactionStore.cs        # Store abstraction
│   └── TransactionStore.cs             # In-memory ConcurrentQueue implementation
├── Endpoints/
│   └── TransactionEndpoints.cs         # REST API (POST + GET)
├── Hubs/
│   └── MonitorHub.cs                   # SignalR hub for real-time push
├── Middleware/
│   └── GlobalExceptionMiddleware.cs    # Centralized error handling
├── Extensions/
│   └── ServiceCollectionExtensions.cs  # DI helper extensions
├── Dockerfile                          # Multi-stage production build
└── k8s/
    ├── deployment.yaml                 # Kubernetes Deployment (3 replicas)
    └── service.yaml                    # Kubernetes ClusterIP Service
```

## Architecture

```
Client (React + Vite)                   Server (.NET 9)
┌───────────────┐                      ┌───────────────────────┐
│  /add         │── POST /api/ ──────► │  TransactionEndpoints │
│  (Simulator)  │   transactions       │         │             │
└───────────────┘                      │         ▼             │
                                       │  TransactionStore     │
┌───────────────┐                      │  (ConcurrentQueue)    │
│  /monitor     │◄── SignalR ───────── │         │             │
│  (Dashboard)  │    WebSocket         │         ▼             │
└───────────────┘                      │  MonitorHub (SignalR)  │
                                       └───────────────────────┘
```

## API Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| `POST` | `/api/transactions` | Ingest a new transaction |
| `GET` | `/api/transactions` | Retrieve all stored transactions |
| — | `/hub/monitor` | SignalR hub for real-time updates |

## Data Model

```json
{
  "transactionId": "string",
  "amount": 1500.00,
  "currency": "USD",
  "status": "Pending | Completed | Failed",
  "timestamp": "2024-01-15T10:00:00Z"
}
```

## Running Locally

```bash
dotnet run
# Server starts on http://localhost:5227
```

## Running Tests

```bash
cd ../FinancialMonitor.Tests
dotnet test
```

---

## Deployment (DevOps)

### Dockerfile

Multi-stage Alpine-based build for minimal image size:

```dockerfile
# Build stage
FROM mcr.microsoft.com/dotnet/sdk:9.0-alpine AS build
WORKDIR /src
COPY *.csproj ./
RUN dotnet restore
COPY . .
RUN dotnet publish -c Release -o /app/publish --no-restore

# Runtime stage (~100 MB)
FROM mcr.microsoft.com/dotnet/aspnet:9.0-alpine AS runtime
WORKDIR /app
COPY --from=build /app/publish .
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080
ENTRYPOINT ["dotnet", "FinancialMonitor.Api.dll"]
```

Build & run:

```bash
docker build -t financial-monitor-api .
docker run -p 8080:8080 financial-monitor-api
```

### Kubernetes Manifests

**Deployment** — 3 replicas with resource limits, readiness & liveness probes:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: financial-monitor-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: financial-monitor-api
  template:
    spec:
      containers:
        - name: api
          image: financial-monitor-api:latest
          ports:
            - containerPort: 8080
          resources:
            requests: { memory: "128Mi", cpu: "100m" }
            limits:   { memory: "256Mi", cpu: "250m" }
          readinessProbe:
            httpGet: { path: /api/transactions, port: 8080 }
          livenessProbe:
            httpGet: { path: /api/transactions, port: 8080 }
```

**Service** — ClusterIP exposing port 80 → 8080:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: financial-monitor-api
spec:
  type: ClusterIP
  selector:
    app: financial-monitor-api
  ports:
    - port: 80
      targetPort: 8080
```

---

## Architecture Decision Record (ADR)

### Problem: Multi-Pod Synchronization

When deploying to Kubernetes with multiple replicas (e.g., 5 pods),
each pod has its own **isolated** in-memory store and **independent** SignalR hub.

**What goes wrong:**

- Client connected to **Pod A** sends a `POST` → Pod A stores the transaction and broadcasts via SignalR
- Client connected to **Pod B** never receives that transaction
- Each pod is a silo — no shared memory, no shared WebSocketctions

```
     ┌──────────┐
     │ Client 1 │──► Pod A  (has tx1, tx2, tx3)
     └──────────┘
     ┌──────────┐
     │ Client 2 │──► Pod B  (has tx4, tx5)         ← Can't see tx1tx3!
     └──────────┘
     ┌──────────┐
     │ Client 3 │──► Pod C  (empty)                 ← Sees nothing!
     └──────────┘
```

### Solution: Redis Backplane + Shared Storage

Two changes are needed to make the system work across multiple pods:

1. **SignalR Redis Backplane** — so all pods share real-time broadcasts
2. **Shared Data Store** — so all pods read/write from the same source of truth

```
                      ┌──────────────────┐
                      │   Redis PubSub   │
                      │   (Backplane)    │
                      └──┬────┬────┬────┘
                         │    │    │
                ┌────────┘    │    └────────┐
                ▼             ▼             ▼
          ┌──────────┐ ┌──────────┐ ┌──────────┐
          │  Pod A   │ │  Pod B   │ │  Pod N   │
          │ SignalR  │ │ SignalR  │ │ SignalR  │
          └────┬─────┘ └────┬─────┘ └────┬─────┘
               │             │             │
               └─────────────┼─────────────┘
                             ▼
                    ┌────────────────┐
                    │  Redis / SQL   │
                    │ (Shared Store) │
                    └────────────────┘
```

#### Step 1: SignalR Redis Backplane

Add the NuGet package and configure in `Program.cs`:

```csharp
// Install: dotnet add package Microsoft.AspNetCore.SignalR.StackExchangeRedis

builder.Services.AddSignalR()
    .AddStackExchangeRedis(connectionString, options =>
    {
        options.Configuration.ChannelPrefix =
            RedisChannel.Literal("FinancialMonitor");
    });
```

When Pod A broadcasts a SignalR message, Redis forwards it to **all pods**.  
Every connected client receives the update, regardless of which pod they're on.

#### Step 2: Shared Data Store

Replace the in-memory `ConcurrentQueue` with a shared store — **Redis** (fast, ideal for real-time) or **PostgreSQL/SQL Server** (durable, queryable):

```csharp
public class RedisTransactionStore : ITransactionStore
{
    private readonly IDatabase _redis;

    public void Add(Transaction t)
        => _redis.ListLeftPush("transactions", JsonSerializer.Serialize(t));

    public IReadOnlyCollection<Transaction> GetAll()
        => _redis.ListRange("transactions")
                 .Select(v => JsonSerializer.Deserialize<Transaction>(v!))
                 .ToList()!;
}
```

The `ITransactionStore` interface stays the same — only the DI registration changes:

```csharp
// Before (single-pod)
builder.Services.AddSingleton<ITransactionStore, TransactionStore>();

// After (multi-pod)
builder.Services.AddSingleton<ITransactionStore, RedisTransactionStore>();
```

#### Step 3: Add Redis to the Kubernetes Cluster

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: redis
spec:
  replicas: 1
  selector:
    matchLabels:
      app: redis
  template:
    metadata:
      labels:
        app: redis
    spec:
      containers:
        - name: redis
          image: redis:7-alpine
          ports:
            - containerPort: 6379
---
apiVersion: v1
kind: Service
metadata:
  name: redis
spec:
  selector:
    app: redis
  ports:
    - port: 6379
      targetPort: 6379
```

### Why Redis?

| Approach | Pros | Cons |
|----------|------|------|
| **Redis Backplane** | Simple setup, built-in SignalR support, real-time | Requires a Redis instance |
| **Sticky Sessions** | No code changes needed | Doesn't solve data consistency across pods |
| **Database Polling** | Simple to implement | High latency, not truly real-time |
| **Message Queue (RabbitMQ/Kafka)** | Fully decoupled, durable | More complex infrastructure |

**Chosen: Redis** — minimal code changes, native .NET SignalR support, excellent real-time performance, and serves as both the backplane and the shared data store.
