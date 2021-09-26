using System;
using System.Linq;
using System.Threading.Tasks;

using Microsoft.AspNetCore.Mvc;

using JobHunt.DTO;
using JobHunt.Models;
using JobHunt.Services;

namespace JobHunt.Controllers {
    [ApiController]
    [Route("api/[controller]/[action]")]
    public class CategoriesController : ControllerBase {
        private readonly ICategoryService _categoryService;
        public CategoriesController(ICategoryService categoryService) {
            _categoryService = categoryService;
        }

        [HttpGet]
        [Route("~/api/categories")]
        public async Task<IActionResult> GetAll() {
            return new JsonResult(await _categoryService.GetAllAsync());
        }
    }
}