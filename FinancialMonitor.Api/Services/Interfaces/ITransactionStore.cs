
using FinancialMonitor.Api.Models;

namespace FinancialMonitor.Api.Services.Interfaces
{
    public interface ITransactionStore
    {
        void Add(Transaction transaction);
        IReadOnlyCollection<Transaction> GetAll();
    }
}
