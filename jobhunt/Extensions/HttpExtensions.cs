using System.Threading.Tasks;
using System.Net;
using System.Net.Http;

namespace JobHunt.Extensions {
    public static class HttpClientExtensions  {
        public static async Task<HttpStatusCode> GetStatusCodeAsync(this HttpClient client, string requestUri) {
            HttpRequestMessage headRequest = new HttpRequestMessage(HttpMethod.Head, requestUri);
            using (var headResponse = await client.SendAsync(headRequest, HttpCompletionOption.ResponseHeadersRead)) {
                // retry as GET if HEAD not supported
                // good servers should return MethodNotAllowed in such a case, but I have seen some return NotFound
                if (headResponse.StatusCode == HttpStatusCode.MethodNotAllowed || headResponse.StatusCode == HttpStatusCode.NotFound) {
                    using (var getResponse = await client.GetAsync(requestUri, HttpCompletionOption.ResponseHeadersRead)) {
                        return getResponse.StatusCode;
                    }
                } else {
                    return headResponse.StatusCode;
                }
            }
        }
    }

    public static class HttpStatusCodeExtensions {
        public static bool IsSuccessStatusCode(this HttpStatusCode code) {
            return (int) code >= 200 && (int) code <= 299;
        }
    }
}