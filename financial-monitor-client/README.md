# Financial Monitor — Real-Time Transaction Dashboard

## Architecture Decision: Multi-Pod Synchronization

### Problem
When running multiple replicas behind a load balancer, a client connected 
via WebSocket to **Pod A** will not receive transactions posted to **Pod B**, 
because the in-memory store and SignalR hub are local to each pod.

### Solution: Redis Backplane + Shared Storage

```
                    ┌──────────────┐
                    │  Redis PubSub│
                    │  (Backplane) │
                    └──┬───┬───┬───┘
                       │   │   │
              ┌────────┘   │   └────────┐
              ▼            ▼            ▼
         ┌─────────┐ ┌─────────┐ ┌─────────┐
         │  Pod A  │ │  Pod B  │ │  Pod C  │
         │ SignalR │ │ SignalR │ │ SignalR │
         └─────────┘ └─────────┘ └─────────┘
```

1. **SignalR Redis Backplane**: Use `Microsoft.AspNetCore.SignalR.StackExchangeRedis` 
   so that messages published on any pod are forwarded to all pods.
   ```csharp
   builder.Services.AddSignalR().AddStackExchangeRedis(redisConnectionString);
   ```

2. **Shared Data Store**: Replace the in-memory `ConcurrentQueue` with a 
   shared data store (Redis, PostgreSQL, or SQLite on a persistent volume) 
   so that `GET /api/transactions` returns the same data from every pod.

3. **Sticky Sessions (alternative)**: As a simpler but less robust approach, 
   configure the load balancer with sticky sessions. This does NOT solve the 
   data-consistency problem but keeps WebSocket connections stable.

### Chosen Approach
Redis backplane + PostgreSQL/Redis for shared storage is the recommended 
production solution. It is horizontally scalable and cloud-native.