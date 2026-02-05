using BagsApi.Models;
using BagsApi.Services;
using Microsoft.AspNetCore.Mvc;

namespace BagsApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class OrdersController : ControllerBase
{
    private readonly IOrderService _service;

    public OrdersController(IOrderService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Order>>> GetAll()
    {
        var orders = await _service.GetAllAsync();
        return Ok(orders);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<Order>> Get(int id)
    {
        var order = await _service.GetByIdAsync(id);
        if (order is null) return NotFound();
        return Ok(order);
    }

    [HttpPost]
    public async Task<ActionResult<Order>> Create(Order order)
    {
        var created = await _service.CreateAsync(order);
        return CreatedAtAction(nameof(Get), new { id = created.Id }, created);
    }

    public record UpdateStatusRequest(string Status);

    [HttpPut("{id:int}/status")]
    public async Task<ActionResult<Order>> UpdateStatus(int id, [FromBody] UpdateStatusRequest request)
    {
        var updated = await _service.UpdateStatusAsync(id, request.Status);
        if (updated is null) return NotFound();
        return Ok(updated);
    }
}
