using System.Net.Http;
using System.Threading.Tasks;

using JobHunt.DTO;

namespace JobHunt.Searching {
    public interface ISearchProvider {
        Task SearchAsync(SearchParameters searchParams, HttpClient client);
    }
}