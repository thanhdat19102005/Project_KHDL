using NRedisStack;
using NRedisStack.RedisStackCommands;
using NRedisStack.Search;
using NRedisStack.Search.Literals.Enums;
using StackExchange.Redis;
using Project_KHDL.Server.Models;

namespace Project_KHDL.Server.Services
{
    public class RediSearchService
    {
        private readonly IConnectionMultiplexer _redis;
        private const string INDEX_NAME = "idx:customers";
        private const string PREFIX = "customer:";
        private const string SUGGEST_INDEX_NAME = "suggest:customers";

        public RediSearchService(IConfiguration configuration)
        {
            var redisConn = configuration.GetValue<string>("Redis:Configuration") ?? "localhost:6379";
            _redis = ConnectionMultiplexer.Connect(redisConn);
        }

        private ISearchCommands GetSearch() => _redis.GetDatabase().FT();

        public async Task InitializeIndexAsync(IEnumerable<dynamic> customers)
        {
            try
            {
                var search = GetSearch();
                
                // 1. Drop existing index and suggester if they exist
                try { search.DropIndex(INDEX_NAME); } catch { }
                try { _redis.GetDatabase().KeyDelete(SUGGEST_INDEX_NAME); } catch { }

                // 2. Define schema
                var schema = new Schema()
                    .AddTextField("CustomerId", 1.0)
                    .AddNumericField("TotalSearch", true)
                    .AddNumericField("Cluster", true);

                // 3. Create index with Prefix using FTCreateParams
                var parameters = new FTCreateParams()
                    .On(IndexDataType.HASH)
                    .Prefix(PREFIX);

                search.Create(INDEX_NAME, parameters, schema); 
                Console.WriteLine($"[RediSearch] Index '{INDEX_NAME}' created with prefix '{PREFIX}'.");

                // 4. Add customers in batches to avoid overwhelming Redis
                var db = _redis.GetDatabase();
                var list = customers.ToList();
                int batchSize = 5000;
                
                for (int i = 0; i < list.Count; i += batchSize)
                {
                    var batch = list.Skip(i).Take(batchSize).ToList();
                    
                    // Batch HashSet for search index
                    var hashTasks = batch.Select(customer => {
                        var key = $"{PREFIX}{customer.CustomerId}";
                        return db.HashSetAsync(key, new HashEntry[] {
                            new HashEntry("CustomerId", (string)customer.CustomerId),
                            new HashEntry("TotalSearch", (long)(customer.TotalSearch ?? 0)),
                            new HashEntry("Cluster", (int)(customer.Cluster ?? 2))
                        });
                    });

                    foreach(var customer in batch) {
                        search.SugAdd(SUGGEST_INDEX_NAME, (string)customer.CustomerId, (double)(customer.TotalSearch ?? 1.0));
                    }

                    await Task.WhenAll(hashTasks);
                    
                    if (i % 50000 == 0) {
                        Console.WriteLine($"[RediSearch] Progress: {i}/{list.Count} indexed...");
                        await Task.Delay(50); 
                    }
                }
                
                Console.WriteLine($"[RediSearch] Indexed {list.Count} customers successfully.");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[RediSearch] Initialization failed: {ex.Message}\n{ex.StackTrace}");
            }
        }

        public async Task<IEnumerable<string>> GetSuggestionsAsync(string prefix)
        {
            if (string.IsNullOrWhiteSpace(prefix)) return Array.Empty<string>();
            try
            {
                var search = GetSearch();
                // SugGet returns string[] in current NRedisStack version
                var results = search.SugGet(SUGGEST_INDEX_NAME, prefix, fuzzy: true);
                return results.Take(10);
            }
            catch { return Array.Empty<string>(); }
        }

        public async Task<(List<string> ids, long total)> SearchAsync(string query, int? cluster = null, int page = 1, int pageSize = 16)
        {
            try
            {
                var search = GetSearch();
                
                // RediSearch prefix query: query* (faster than *query*)
                var searchQuery = string.IsNullOrWhiteSpace(query) ? "*" : $"{query}*";

                // Add cluster filter if provided: @Cluster:[cluster cluster]
                if (cluster.HasValue)
                {
                    searchQuery = $"({searchQuery}) @Cluster:[{cluster.Value} {cluster.Value}]";
                }
                
                var q = new Query(searchQuery)
                    .Limit((page - 1) * pageSize, pageSize);
                
                // Ensure sorting works
                q.SortBy = "TotalSearch";
                q.SortAscending = false;

                var result = search.Search(INDEX_NAME, q);
                
                var ids = result.Documents
                    .Select(d => d["CustomerId"].ToString())
                    .ToList();

                return (ids, result.TotalResults);
            }
            catch (Exception ex)
            {
                if (!ex.Message.Contains("No such index"))
                {
                    Console.WriteLine($"[RediSearch] Search failed: {ex.Message}");
                }
                return (new List<string>(), 0);
            }
        }
    }
}
