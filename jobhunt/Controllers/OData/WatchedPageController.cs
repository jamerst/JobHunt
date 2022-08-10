namespace JobHunt.Controllers.OData;

public class WatchedPageController : ODataBaseController<WatchedPage>
{
    public WatchedPageController(IWatchedPageService service) : base(service) { }
}