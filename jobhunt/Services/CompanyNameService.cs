using JobHunt.Services.BaseServices;

namespace JobHunt.Services;

public class CompanyNameService : ODataBaseService<CompanyName>, ICompanyNameService
{
    public CompanyNameService(JobHuntContext context) : base(context) { }
}

public interface ICompanyNameService : IODataBaseService<CompanyName> { }