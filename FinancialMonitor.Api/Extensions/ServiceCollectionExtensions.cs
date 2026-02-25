using FinancialMonitor.Api.Services.Interfaces;
using FinancialMonitor.Api.Services;

namespace FinancialMonitor.Api.Extensions
{
    public static class ServiceCollectionExtensions
    {
        public static IServiceCollection AddApplicationServices(this IServiceCollection services)
        {
            services.AddSingleton<ITransactionStore, TransactionStore>();
            return services;
        }
    }
}
