namespace JobHunt.Controllers.OData;

public class SearchController : ODataBaseController<Search>
{
    public SearchController(ISearchService service) : base(service) { }
}