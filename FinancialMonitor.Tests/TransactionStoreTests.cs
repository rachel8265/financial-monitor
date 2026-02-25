using FinancialMonitor.Api.Models;
using FinancialMonitor.Api.Services;

namespace FinancialMonitor.Tests;

public class TransactionStoreTests
{
    [Fact]
    public void Add_SingleTransaction_AppearsInGetAll()
    {
        var store = new TransactionStore();
        var tx = new Transaction
        {
            TransactionId = Guid.NewGuid().ToString(),
            Amount = 100m,
            Currency = "USD",
            Status = TransactionStatus.Completed,
            Timestamp = DateTime.UtcNow
        };

        store.Add(tx);

        var all = store.GetAll();
        Assert.Single(all);
        Assert.Equal(tx.TransactionId, all.First().TransactionId);
    }

    [Fact]
    public void Add_MultipleTransactions_AllAppearInGetAll()
    {
        var store = new TransactionStore();

        for (int i = 0; i < 50; i++)
        {
            store.Add(new Transaction
            {
                TransactionId = Guid.NewGuid().ToString(),
                Amount = i * 10m,
                Currency = "USD",
                Status = TransactionStatus.Pending,
                Timestamp = DateTime.UtcNow
            });
        }

        Assert.Equal(50, store.GetAll().Count);
    }

    [Fact]
    public async Task Add_ConcurrentWrites_NoDataLoss()
    {
        var store = new TransactionStore();
        const int threadCount = 10;
        const int itemsPerThread = 100;

        var tasks = Enumerable.Range(0, threadCount).Select(_ =>
            Task.Run(() =>
            {
                for (int i = 0; i < itemsPerThread; i++)
                {
                    store.Add(new Transaction
                    {
                        TransactionId = Guid.NewGuid().ToString(),
                        Amount = 1m,
                        Currency = "USD",
                        Status = TransactionStatus.Completed,
                        Timestamp = DateTime.UtcNow
                    });
                }
            })
        ).ToArray();

        await Task.WhenAll(tasks);

        Assert.Equal(threadCount * itemsPerThread, store.GetAll().Count);
    }

    [Fact]
    public void GetAll_ReturnsSnapshot_NotAffectedByLaterAdds()
    {
        var store = new TransactionStore();
        store.Add(new Transaction
        {
            TransactionId = "tx-1",
            Amount = 50m,
            Currency = "USD",
            Status = TransactionStatus.Failed,
            Timestamp = DateTime.UtcNow
        });

        var snapshot = store.GetAll();

        store.Add(new Transaction
        {
            TransactionId = "tx-2",
            Amount = 75m,
            Currency = "USD",
            Status = TransactionStatus.Pending,
            Timestamp = DateTime.UtcNow
        });

        Assert.Single(snapshot);
        Assert.Equal(2, store.GetAll().Count);
    }

    [Fact]
    public void Add_TransactionStatusValues_ParseCorrectly()
    {
        var store = new TransactionStore();

        store.Add(new Transaction { TransactionId = "1", Status = TransactionStatus.Pending });
        store.Add(new Transaction { TransactionId = "2", Status = TransactionStatus.Completed });
        store.Add(new Transaction { TransactionId = "3", Status = TransactionStatus.Failed });

        var all = store.GetAll().ToList();
        Assert.Equal(TransactionStatus.Pending, all[0].Status);
        Assert.Equal(TransactionStatus.Completed, all[1].Status);
        Assert.Equal(TransactionStatus.Failed, all[2].Status);
    }

    [Fact]
    public void GetAll_EmptyStore_ReturnsEmptyCollection()
    {
        var store = new TransactionStore();
        var result = store.GetAll();
        Assert.Empty(result);
    }

    [Fact]
    public void Add_PreservesAllFields()
    {
        var store = new TransactionStore();
        var now = DateTime.UtcNow;
        var tx = new Transaction
        {
            TransactionId = "test-guid-123",
            Amount = 1500.50m,
            Currency = "EUR",
            Status = TransactionStatus.Completed,
            Timestamp = now
        };

        store.Add(tx);
        var result = store.GetAll().First();

        Assert.Equal("test-guid-123", result.TransactionId);
        Assert.Equal(1500.50m, result.Amount);
        Assert.Equal("EUR", result.Currency);
        Assert.Equal(TransactionStatus.Completed, result.Status);
        Assert.Equal(now, result.Timestamp);
    }
}

