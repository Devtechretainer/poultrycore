using BagsApi.Models;
using BagsApi.Data;
using Microsoft.EntityFrameworkCore;

namespace BagsApi.Services;

public class BlogService : IBlogService
{
    private readonly BagsDbContext _context;

    public BlogService(BagsDbContext context)
    {
        _context = context;
    }

    public async Task<List<BlogPost>> GetAllAsync()
    {
        return await _context.BlogPosts
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync();
    }

    public async Task<BlogPost?> GetByIdAsync(int id)
    {
        return await _context.BlogPosts.FindAsync(id);
    }

    public async Task<BlogPost> CreateAsync(BlogPost post)
    {
        post.CreatedAt = DateTime.UtcNow;
        _context.BlogPosts.Add(post);
        await _context.SaveChangesAsync();
        return post;
    }

    public async Task<BlogPost?> UpdateAsync(int id, BlogPost updated)
    {
        var existing = await _context.BlogPosts.FindAsync(id);
        if (existing is null) return null;

        existing.Title = updated.Title;
        existing.Content = updated.Content;
        existing.ImageUrl = updated.ImageUrl;
        existing.Category = updated.Category;

        await _context.SaveChangesAsync();
        return existing;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var existing = await _context.BlogPosts.FindAsync(id);
        if (existing is null) return false;

        _context.BlogPosts.Remove(existing);
        await _context.SaveChangesAsync();
        return true;
    }
}
