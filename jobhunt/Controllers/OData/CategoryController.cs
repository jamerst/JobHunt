namespace JobHunt.Controllers.OData;

public class CategoryController : ODataBaseController<Category>
{
    public CategoryController(ICategoryService service) : base(service) { }
}