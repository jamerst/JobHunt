namespace JobHunt.Controllers.OData;

public class JobController : ODataBaseController<Job>
{
    public JobController(IJobService service) : base(service) { }
}