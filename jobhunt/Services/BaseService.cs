using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

using Microsoft.EntityFrameworkCore;

using JobHunt.Data;

namespace JobHunt.Services {
    public class BaseService<T> : IBaseService<T> where T : class {
        protected readonly JobHuntContext _context;

        public BaseService(JobHuntContext context) {
            _context = context;
        }

        public DbSet<T> Set => _context.Set<T>();

        public Task<int> SaveChangesAsync() => _context.SaveChangesAsync();
    }

    public interface IBaseService<T> where T : class {
        DbSet<T> Set { get; }
        Task<int> SaveChangesAsync();
    }
}