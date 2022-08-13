using Refit;

namespace JobHunt.Searching.Indeed;

public interface IIndeedSalaryApi
{
    [Get("/viewjob?vjs=1&jk={jobKey}")]
    Task<ApiResponse<SalaryResponse>> GetSalaryAsync(string jobKey);
}

// need to use a factory to create these since the domain depends on the job location and the base address for a HTTPClient cannot be changed
// we need to use the same domain as the country that the job is advertised in order to get the salary in the local currency
public class IndeedSalaryApiFactory : IIndeedSalaryApiFactory
{
    private readonly IHttpClientFactory _clientFactory;
    public IndeedSalaryApiFactory(IHttpClientFactory clientFactory)
    {
        _clientFactory = clientFactory;
    }

    public IIndeedSalaryApi CreateApi(string baseAddress)
    {
        var client = _clientFactory.CreateClient(baseAddress);
        client.BaseAddress = new Uri(baseAddress);

        return RestService.For<IIndeedSalaryApi>(client);
    }
}

public interface IIndeedSalaryApiFactory
{
    IIndeedSalaryApi CreateApi(string baseAddress);
}