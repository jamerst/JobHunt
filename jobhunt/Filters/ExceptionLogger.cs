using System.Net;

using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace JobHunt.Filters;
public class ExceptionLogger : IAsyncExceptionFilter
{
    private readonly ILogger _logger;
    public ExceptionLogger(ILogger<ExceptionLogger> logger) : base()
    {
        _logger = logger;
    }
    public Task OnExceptionAsync(ExceptionContext context)
    {
        _logger.LogError(context.Exception, "Uncaught exception thrown");

        context.Result = new ContentResult { StatusCode = StatusCodes.Status500InternalServerError, Content = "JobHunt has encountered an error. Please try again or report an issue at https://github.com/jamerst/JobHunt/issues.", ContentType = "text/plain" };
        return Task.CompletedTask;
    }
}