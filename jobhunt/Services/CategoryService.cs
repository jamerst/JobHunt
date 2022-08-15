using JobHunt.Services.BaseServices;

public class CategoryService : ODataBaseService<Category>, ICategoryService
{
    public CategoryService(JobHuntContext context) : base(context) {}
}

public interface ICategoryService : IODataBaseService<Category> { }