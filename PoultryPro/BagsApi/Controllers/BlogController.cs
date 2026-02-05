using BagsApi.Models;
using BagsApi.Services;
using Microsoft.AspNetCore.Mvc;

namespace BagsApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class BlogController : ControllerBase
{
    private readonly IBlogService _service;

    public BlogController(IBlogService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<BlogPost>>> GetAll()
    {
        var posts = await _service.GetAllAsync();
        return Ok(posts);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<BlogPost>> Get(int id)
    {
        var post = await _service.GetByIdAsync(id);
        if (post is null) return NotFound();
        return Ok(post);
    }

    [HttpPost]
    public async Task<ActionResult<BlogPost>> Create(BlogPost post)
    {
        var created = await _service.CreateAsync(post);
        return CreatedAtAction(nameof(Get), new { id = created.Id }, created);
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<BlogPost>> Update(int id, BlogPost post)
    {
        var updated = await _service.UpdateAsync(id, post);
        if (updated is null) return NotFound();
        return Ok(updated);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var ok = await _service.DeleteAsync(id);
        if (!ok) return NotFound();
        return NoContent();
    }
}
