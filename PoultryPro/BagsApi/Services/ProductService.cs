using BagsApi.Models;
using BagsApi.Data;
using Microsoft.EntityFrameworkCore;

namespace BagsApi.Services;

public class ProductService : IProductService
{
    private readonly BagsDbContext _context;

    public ProductService(BagsDbContext context)
    {
        _context = context;
    }

    public async Task<List<Product>> GetAllAsync()
    {
        return await _context.Products.ToListAsync();
    }

    public async Task<Product?> GetByIdAsync(int id)
    {
        return await _context.Products.FindAsync(id);
    }

    public async Task<Product> CreateAsync(Product product)
    {
        _context.Products.Add(product);
        await _context.SaveChangesAsync();
        return product;
    }

    public async Task<Product?> UpdateAsync(int id, Product updated)
    {
        var existing = await _context.Products.FindAsync(id);
        if (existing is null) return null;

        existing.Name = updated.Name;
        existing.Price = updated.Price;
        existing.ImageUrl = updated.ImageUrl;
        existing.Category = updated.Category;
        existing.Description = updated.Description;

        await _context.SaveChangesAsync();
        return existing;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var existing = await _context.Products.FindAsync(id);
        if (existing is null) return false;

        _context.Products.Remove(existing);
        await _context.SaveChangesAsync();
        return true;
    }
}
