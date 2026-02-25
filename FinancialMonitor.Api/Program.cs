//var builder = WebApplication.CreateBuilder(args);

//// Add services to the container.
//// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
//////builder.Services.AddOpenApi();

//var app = builder.Build();

////// Configure the HTTP request pipeline.
//////if (app.Environment.IsDevelopment())
//////{
//////    app.MapOpenApi();
//////}

//if (!app.Environment.IsDevelopment())
//{
//    app.UseHttpsRedirection();
//}


//app.Run();

//////record WeatherForecast(DateOnly Date, int TemperatureC, string? Summary)
//////{
//////    public int TemperatureF => 32 + (int)(TemperatureC / 0.5556);
//////}
using FinancialMonitor.Api.Endpoints;
using FinancialMonitor.Api.Services.Interfaces;
using FinancialMonitor.Api.Hubs;
using FinancialMonitor.Api.Services;

var builder = WebApplication.CreateBuilder(args);

// Services
builder.Services.AddCors(options =>
{
    options.AddPolicy("DevCors", policy =>
    {
        policy
            .WithOrigins("http://localhost:5173")
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

builder.Services.AddSignalR()
    .AddJsonProtocol(options =>
    {
        options.PayloadSerializerOptions.Converters.Add(
            new System.Text.Json.Serialization.JsonStringEnumConverter());
    });

builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.Converters.Add(
        new System.Text.Json.Serialization.JsonStringEnumConverter());
});

// àí éù ìê îéîåù ìÎITransactionStore:
builder.Services.AddSingleton<ITransactionStore, TransactionStore>();

var app = builder.Build();

app.UseCors("DevCors");



// îéôåé endpoints
app.MapTransactionEndpoints();
app.MapHub<MonitorHub>("/hub/monitor");

app.Run();