using Serilog;
using Serilog.Exceptions;
using Serilog.Exceptions.Destructurers;
using Serilog.Exceptions.Core;
using Serilog.Exceptions.EntityFrameworkCore.Destructurers;
using Serilog.Exceptions.Refit.Destructurers;

namespace JobHunt.Extensions;

public static class HostBuilderExtensions
{
    /// <summary>
    /// Add the default Serilog configuration with destructurers
    /// </summary>
    public static IHostBuilder UseJobHuntSerilog(this IHostBuilder builder)
    {
        builder.UseSerilog((ctx, lc) => lc
            .Enrich.WithExceptionDetails(new DestructuringOptionsBuilder()
                .WithDefaultDestructurers()
                .WithDestructurers(new IExceptionDestructurer[]
                {
                    new DbUpdateExceptionDestructurer(),
                    new ApiExceptionDestructurer(destructureHttpContent: true)
                }))
            .Enrich.FromLogContext()
            .ReadFrom.Configuration(ctx.Configuration)
        );

        return builder;
    }
}