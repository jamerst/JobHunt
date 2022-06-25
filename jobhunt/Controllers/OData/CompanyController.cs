namespace JobHunt.Controllers.OData;

public class CompanyController : ODataBaseController<Company>
{
    public CompanyController(ICompanyService service) : base(service) { }
}