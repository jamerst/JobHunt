using System.Net.Http;
using System.Threading;
using System.Threading.Tasks;

using JobHunt.DTO;

namespace JobHunt.Searching {
    public interface ISearchProvider {
        Task<SearchResults> SearchAsync(SearchParameters searchParams, HttpClient client, CancellationToken token);
    }
}