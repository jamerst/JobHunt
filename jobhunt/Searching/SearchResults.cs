using System.Collections.Generic;

using JobHunt.DTO;

namespace JobHunt.Searching {
    public class SearchResults {
        public string SearchId { get; set; } = null!;
        public IList<Job> Jobs { get; set; } = new List<Job>();
        public IList<Company> Companies { get; set; } = new List<Company>();
        public bool Success { get; set; } = true;
        public SearchResults(string searchId) {
            SearchId = searchId;
        }
    }
}