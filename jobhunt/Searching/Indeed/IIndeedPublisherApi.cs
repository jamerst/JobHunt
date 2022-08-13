using Refit;

namespace JobHunt.Searching.Indeed;

public interface IIndeedPublisherApi
{
    [Get("/ads/apisearch")]
    Task<ApiResponse<JobSearchResponse>> SearchAsync(JobSearchParams searchParams);
}

public class JobSearchParams
{
    public JobSearchParams(string publisherId, Search search)
    {
        PublisherId = publisherId;
        Query = search.Query;
        Country = search.Country;
        Location = search.Location;
        Radius = search.Distance;
        FromAge = search.MaxAge;

        if (search.EmployerOnly)
        {
            // presuming this means "exclude recruiter"
            // to exclude direct hire you can use 0bf:exdh();
            EmployerType = "0bf:exrec();";
        }

        JobType = search.JobType;
    }

    [AliasAs("publisher")]
    public string PublisherId { get; private set; }

    [AliasAs("q")]
    public string Query { get; set; }

    [AliasAs("co")]
    public string Country { get; set; }

    [AliasAs("l")]
    public string? Location { get; set; }

    [AliasAs("radius")]
    public int? Radius { get; set; }

    [AliasAs("fromage")]
    public int? FromAge { get; set; }

    [AliasAs("sc")]
    public string? EmployerType { get; private set; }

    [AliasAs("jt")]
    public string? JobType { get; set; }

    [AliasAs("start")]
    public int Start { get; set; }

    #region Constant Parameters
    [AliasAs("sort")]
    public string Sort => "date";

    [AliasAs("limit")]
    public int PageSize => IndeedApiSearchProvider.PageSize;

    [AliasAs("format")]
    public string Format => "json";

    [AliasAs("userip")]
    public string UserIP => "1.2.3.4";

    [AliasAs("useragent")]
    public string UserAgent => "Mozilla//4.0(Firefox)";

    [AliasAs("latlong")]
    public int ReturnCoordinates => 1;

    [AliasAs("v")]
    public int Version => 2;

    [AliasAs("filter")]
    public int FilterDuplicates => 0;
    #endregion
}