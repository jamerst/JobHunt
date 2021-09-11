using System.Net.Http;
using System.Threading;
using System.Threading.Tasks;

using JobHunt.Models;

namespace JobHunt.Searching {
    public interface ISearchProvider {
        Task SearchAllAsync(CancellationToken token);
        Task SearchAsync(Search searchParams, CancellationToken token);
    }
}