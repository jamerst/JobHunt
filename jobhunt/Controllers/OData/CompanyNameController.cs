namespace JobHunt.Controllers.OData;

public class CompanyNameController : ODataBaseController<CompanyName>
{
    public CompanyNameController(ICompanyNameService service) : base(service) { }
}