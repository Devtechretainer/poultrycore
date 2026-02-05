using BagsApi.Models;

namespace BagsApi.Services;

public interface IProductService
{
    Task<List<Product>> GetAllAsync();
    Task<Product?> GetByIdAsync(int id);
    Task<Product> CreateAsync(Product product);
    Task<Product?> UpdateAsync(int id, Product product);
    Task<bool> DeleteAsync(int id);
}

public interface IOrderService
{
    Task<List<Order>> GetAllAsync();
    Task<Order?> GetByIdAsync(int id);
    Task<Order> CreateAsync(Order order);
    Task<Order?> UpdateStatusAsync(int id, string status);
}

public interface IBlogService
{
    Task<List<BlogPost>> GetAllAsync();
    Task<BlogPost?> GetByIdAsync(int id);
    Task<BlogPost> CreateAsync(BlogPost post);
    Task<BlogPost?> UpdateAsync(int id, BlogPost post);
    Task<bool> DeleteAsync(int id);
}
