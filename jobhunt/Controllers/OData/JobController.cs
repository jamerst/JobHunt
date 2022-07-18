using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OData.Deltas;

namespace JobHunt.Controllers.OData;

public class JobController : ODataBaseController<Job>
{
    private IJobService _service;
    private ILogger _logger;

    public JobController(IJobService service, ILogger<JobController> logger) : base(service)
    {
        _service = service;
        _logger = logger;
    }
}