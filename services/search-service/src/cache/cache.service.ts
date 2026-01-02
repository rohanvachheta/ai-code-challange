import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, RedisClientType } from 'redis';

@Injectable()
export class CacheService implements OnModuleInit, OnModuleDestroy {
  private client: RedisClientType;
  private readonly defaultTtl = 300; // 5 minutes

  constructor(private readonly configService: ConfigService) {
    const redisUrl = this.configService.get('REDIS_URL', 'redis://localhost:6379');
    this.client = createClient({ url: redisUrl });
    
    this.client.on('error', (error) => {
      console.error('Redis connection error:', error);
    });
  }

  async onModuleInit() {
    try {
      await this.client.connect();
      console.log('Redis connected successfully');
    } catch (error) {
      console.error('Failed to connect to Redis:', error);
      // Continue without Redis cache
    }
  }

  async onModuleDestroy() {
    try {
      await this.client.quit();
    } catch (error) {
      console.error('Error disconnecting Redis:', error);
    }
  }

  async get(key: string): Promise<string | null> {
    try {
      return await this.client.get(key);
    } catch (error) {
      console.error('Redis GET error:', error);
      return null;
    }
  }

  async set(key: string, value: string, ttl: number = this.defaultTtl): Promise<void> {
    try {
      await this.client.setEx(key, ttl, value);
    } catch (error) {
      console.error('Redis SET error:', error);
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.client.del(key);
    } catch (error) {
      console.error('Redis DEL error:', error);
    }
  }

  async keys(pattern: string): Promise<string[]> {
    try {
      return await this.client.keys(pattern);
    } catch (error) {
      console.error('Redis KEYS error:', error);
      return [];
    }
  }

  // Helper method to generate cache key for search queries
  generateSearchKey(userType: string, accountId: string, searchText: string, filters?: any): string {
    const filterStr = filters ? JSON.stringify(filters) : '';
    return `search:${userType}:${accountId}:${Buffer.from(searchText + filterStr).toString('base64')}`;
  }

  // Helper method to cache search results
  async cacheSearchResults(key: string, results: any, ttl: number = this.defaultTtl): Promise<void> {
    try {
      await this.set(key, JSON.stringify(results), ttl);
    } catch (error) {
      console.error('Error caching search results:', error);
    }
  }

  // Helper method to get cached search results
  async getCachedSearchResults(key: string): Promise<any | null> {
    try {
      const cached = await this.get(key);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error('Error getting cached search results:', error);
      return null;
    }
  }

  // Clear cache by pattern (useful for invalidating user-specific caches)
  async clearByPattern(pattern: string): Promise<void> {
    try {
      const keys = await this.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(keys);
      }
    } catch (error) {
      console.error('Error clearing cache by pattern:', error);
    }
  }
}