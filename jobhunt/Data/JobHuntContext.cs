using Microsoft.EntityFrameworkCore;

namespace JobHunt.Data {
    public class JobHuntContext : DbContext {
        public JobHuntContext(DbContextOptions options) : base(options) { }
    }
}