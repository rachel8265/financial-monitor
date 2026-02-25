using System.Net;
using System.Text.Json;

namespace FinancialMonitor.Api.Middleware
{
    public class GlobalExceptionMiddleware
    {
        private readonly RequestDelegate _next;

        public GlobalExceptionMiddleware(RequestDelegate next)
        {
            _next = next;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            try
            {
                await _next(context);
            }
            catch (Exception ex)
            {
                context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;
                context.Response.ContentType = "application/json";

                var response = JsonSerializer.Serialize(new
                {
                    message = ex.Message
                });

                await context.Response.WriteAsync(response);
            }
        }
    }
}
