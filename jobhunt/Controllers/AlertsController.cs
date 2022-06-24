using Microsoft.AspNetCore.Mvc;

namespace JobHunt.Controllers;
[ApiController]
[Route("api/[controller]/[action]")]
public class AlertsController : ControllerBase
{
    private readonly IAlertService _alertService;
    public AlertsController(IAlertService alertService)
    {
        _alertService = alertService;
    }

    [HttpGet]
    [Route("~/api/alerts")]
    public async Task<IActionResult> GetRecent()
    {
        return new JsonResult(await _alertService.GetRecentAsync());
    }

    [HttpGet]
    public async Task<IActionResult> UnreadCount()
    {
        return new JsonResult(await _alertService.GetUnreadCountAsync());
    }

    [HttpPatch("{id}")]
    public async Task<IActionResult> Read([FromRoute] int id)
    {
        bool result = await _alertService.MarkAsReadAsync(id);
        if (result)
        {
            return Ok();
        }
        else
        {
            return NotFound();
        }
    }

    [HttpPatch]
    public async Task AllRead()
    {
        await _alertService.MarkAllAsReadAsync();
    }
}