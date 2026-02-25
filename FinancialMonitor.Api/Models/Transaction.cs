namespace FinancialMonitor.Api.Models
{
    public class Transaction
    {
        //public Guid TransactionId { get; init; }
        //public decimal Amount { get; init; }
        //public string Currency { get; init; } = default!;
        //public TransactionStatus Status { get; init; } = default!;
        //public DateTime Timestamp { get; init; }
        public string TransactionId { get; set; } = "";
        public decimal Amount { get; set; }
        public string Currency { get; set; } = "USD";
        public TransactionStatus Status { get; set; }
        public DateTime Timestamp { get; set; }
    }
    public enum TransactionStatus
    {
        Pending,
        Completed,
        Failed
    }
}
