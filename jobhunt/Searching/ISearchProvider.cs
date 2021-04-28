using System.Net.Http;
using System.Threading;
using System.Threading.Tasks;

using JobHunt.Models;

namespace JobHunt.Searching {
    public interface ISearchProvider {
        Task SearchAsync(Search searchParams, HttpClient client, CancellationToken token);
    }
}