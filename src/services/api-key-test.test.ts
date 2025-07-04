import { describe, it, expect, vi, beforeEach } from 'vitest';
import { checkEnvironmentVariables, testApiConnection } from './api-key-test';

// fetch をモック
globalThis.fetch = vi.fn();

describe('API Key Test Functions', () => {
  describe('checkEnvironmentVariables', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should check environment variables', () => {
      const result = checkEnvironmentVariables();

      // Test the structure of the result regardless of actual API key presence
      expect(typeof result.hasApiKey).toBe('boolean');
      expect(typeof result.apiKeyLength).toBe('number');
      expect(typeof result.apiKeyPreview).toBe('string');
      
      // If API key exists, validate its structure
      if (result.hasApiKey) {
        expect(result.apiKeyLength).toBeGreaterThan(0);
        expect(result.apiKeyPreview).toContain('...');
      } else {
        expect(result.apiKeyLength).toBe(0);
        expect(result.apiKeyPreview).toBe('undefined');
      }
    });
  });

  describe('testApiConnection', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should succeed with valid API key', async () => {
      // 環境変数をモック
      vi.stubGlobal('import.meta', {
        env: {
          VITE_OPENWEATHER_API_KEY: 'valid-api-key'
        }
      });

      // fetch の成功レスポンスをモック
      const mockResponse = {
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({
          name: 'Tokyo',
          weather: [{ description: '晴天' }],
          main: { temp: 25.5 }
        })
      };
      
      (fetch as any).mockResolvedValue(mockResponse);

      const result = await testApiConnection();

      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        city: 'Tokyo',
        weather: '晴天',
        temperature: 25.5
      });
    });

    it('should fail with invalid API key', async () => {
      // 環境変数をモック
      vi.stubGlobal('import.meta', {
        env: {
          VITE_OPENWEATHER_API_KEY: 'invalid-api-key'
        }
      });

      // fetch の失敗レスポンスをモック
      const mockResponse = {
        ok: false,
        status: 401,
        json: vi.fn().mockResolvedValue({
          message: 'Invalid API key'
        })
      };
      
      (fetch as any).mockResolvedValue(mockResponse);

      const result = await testApiConnection();

      expect(result.success).toBe(false);
      expect(result.status).toBe(401);
      expect(result.error).toBe('Invalid API key');
    });

    it('should fail when API key is not set', async () => {
      const result = await testApiConnection();

      expect(result.success).toBe(false);
      expect(result.error).toContain('API key');
    });

    it('should handle network errors', async () => {
      // 環境変数をモック
      vi.stubGlobal('import.meta', {
        env: {
          VITE_OPENWEATHER_API_KEY: 'test-api-key'
        }
      });

      // fetch でネットワークエラーをモック
      (fetch as any).mockRejectedValue(new Error('Network error'));

      const result = await testApiConnection();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
    });

    it('should handle rate limiting (429 status)', async () => {
      // 環境変数をモック
      vi.stubGlobal('import.meta', {
        env: {
          VITE_OPENWEATHER_API_KEY: 'test-api-key'
        }
      });

      // fetch でレート制限レスポンスをモック
      const mockResponse = {
        ok: false,
        status: 429,
        json: vi.fn().mockResolvedValue({
          message: 'Too many requests'
        })
      };
      
      (fetch as any).mockResolvedValue(mockResponse);

      const result = await testApiConnection();

      expect(result.success).toBe(false);
      expect(result.status).toBe(429);
      expect(result.error).toBe('Too many requests');
    });
  });

  describe('API Key Validation', () => {
    it('should validate API key format', () => {
      const result = checkEnvironmentVariables();

      if (result.hasApiKey) {
        expect(result.apiKeyLength).toBeGreaterThan(0);
        expect(result.apiKeyPreview).toContain('...');
        // Real OpenWeatherMap API keys are typically 32 characters
        expect(result.apiKeyLength).toBeGreaterThanOrEqual(8);
      } else {
        expect(result.apiKeyLength).toBe(0);
        expect(result.apiKeyPreview).toBe('undefined');
      }
    });
  });
});