using BagsApi.Models;
using BagsApi.Data;
using Microsoft.EntityFrameworkCore;

namespace BagsApi.Services;

public class OrderService : IOrderService
{
    private readonly BagsDbContext _context;

    public OrderService(BagsDbContext context)
    {
        _context = context;
    }

    public async Task<List<Order>> GetAllAsync()
    {
        return await _context.Orders
            .OrderByDescending(o => o.CreatedAt)
            .ToListAsync();
    }

    public async Task<Order?> GetByIdAsync(int id)
    {
        return await _context.Orders.FindAsync(id);
    }

    public async Task<Order> CreateAsync(Order order)
    {
        order.CreatedAt = DateTime.UtcNow;
        _context.Orders.Add(order);
        await _context.SaveChangesAsync();
        return order;
    }

    public async Task<Order?> UpdateStatusAsync(int id, string status)
    {
        var existing = await _context.Orders.FindAsync(id);
        if (existing is null) return null;

        existing.Status = status;
        await _context.SaveChangesAsync();
        return existing;
    }
}
