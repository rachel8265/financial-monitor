namespace FinancialMonitor.Api.Contracts;

public class TransactionDto
{
    public string TransactionId { get; set; } = "";
    public decimal Amount { get; set; }
    public string Currency { get; set; } = "USD";
    public string Status { get; set; } = "Pending";
    public DateTime Timestamp { get; set; }
}