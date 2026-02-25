using FinancialMonitor.Api.Models;
using FinancialMonitor.Api.Services.Interfaces;
using System.Collections.Concurrent;

namespace FinancialMonitor.Api.Services
{
    public class TransactionStore : ITransactionStore
    {
        private readonly ConcurrentQueue<Transaction> _transactions = new();

        public void Add(Transaction transaction)
        {
            _transactions.Enqueue(transaction);
        }

        public IReadOnlyCollection<Transaction> GetAll()
        {
            return _transactions.ToList();
        }
    }
}
