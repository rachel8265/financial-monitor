using FinancialMonitor.Api.Contracts;
using FinancialMonitor.Api.Hubs;
using FinancialMonitor.Api.Services.Interfaces;
using Microsoft.AspNetCore.SignalR;


using FinancialMonitor.Api.Models;




namespace FinancialMonitor.Api.Endpoints
{
    public static class TransactionEndpoints
    {
        public static void MapTransactionEndpoints(this WebApplication app)
        {
            app.MapPost("/api/transactions",
     async (
         TransactionDto dto,
         ITransactionStore store,
         IHubContext<MonitorHub> hub) =>
     {
         var transaction = new Transaction
         {
             TransactionId = dto.TransactionId,
             Amount = dto.Amount,
             Currency = dto.Currency,
             Status = Enum.TryParse<TransactionStatus>(dto.Status, true, out var status)
                 ? status
                 : TransactionStatus.Pending,
             Timestamp = dto.Timestamp
         };
         store.Add(transaction);

         await hub.Clients.All
             .SendAsync("transactionReceived", transaction);

         return Results.Ok();
     });

            app.MapGet("/api/transactions", (ITransactionStore store) =>
            {
                return Results.Ok(store.GetAll());
            });
        }
    }
}
