import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GeolocationService } from './geolocation.service';

describe('GeolocationService', () => {
  let service: GeolocationService;
  let mockGeolocation: any;

  beforeEach(() => {
    service = new GeolocationService();
    
    // Mock geolocation
    mockGeolocation = {
      getCurrentPosition: vi.fn(),
      watchPosition: vi.fn(),
      clearWatch: vi.fn()
    };

    Object.defineProperty(globalThis.navigator, 'geolocation', {
      value: mockGeolocation,
      writable: true,
      configurable: true
    });

    vi.clearAllMocks();
  });

  describe('getCurrentPosition', () => {
    it('should get current position successfully', async () => {
      const mockPosition = {
        coords: {
          latitude: 35.6762,
          longitude: 139.6503,
          accuracy: 10
        }
      };

      mockGeolocation.getCurrentPosition.mockImplementation((successCallback: (position: GeolocationPosition) => void) => {
        successCallback(mockPosition);
      });

      const result = await service.getCurrentPosition();

      expect(result.lat).toBe(35.6762);
      expect(result.lon).toBe(139.6503);
      expect(result.accuracy).toBe(10);
    });

    it('should handle permission denied error', async () => {
      const mockError = {
        code: 1,
        message: 'User denied the request for Geolocation.'
      };

      mockGeolocation.getCurrentPosition.mockImplementation((_: (position: GeolocationPosition) => void, errorCallback: (error: GeolocationPositionError) => void) => {
        errorCallback(mockError);
      });

      await expect(service.getCurrentPosition()).rejects.toEqual({
        code: 1,
        message: '位置情報の取得が拒否されました'
      });
    });

    it('should handle position unavailable error', async () => {
      const mockError = {
        code: 2,
        message: 'Position unavailable.'
      };

      mockGeolocation.getCurrentPosition.mockImplementation((_: (position: GeolocationPosition) => void, errorCallback: (error: GeolocationPositionError) => void) => {
        errorCallback(mockError);
      });

      await expect(service.getCurrentPosition()).rejects.toEqual({
        code: 2,
        message: '位置情報を取得できませんでした'
      });
    });

    it('should handle timeout error', async () => {
      const mockError = {
        code: 3,
        message: 'Timeout expired.'
      };

      mockGeolocation.getCurrentPosition.mockImplementation((_: (position: GeolocationPosition) => void, errorCallback: (error: GeolocationPositionError) => void) => {
        errorCallback(mockError);
      });

      await expect(service.getCurrentPosition()).rejects.toEqual({
        code: 3,
        message: '位置情報の取得がタイムアウトしました'
      });
    });

    it('should handle unsupported browser', async () => {
      Object.defineProperty(globalThis.navigator, 'geolocation', {
        value: undefined,
        writable: true,
        configurable: true
      });

      await expect(service.getCurrentPosition()).rejects.toEqual({
        code: 0,
        message: 'このブラウザは位置情報をサポートしていません'
      });
    });
  });

  describe('watchPosition', () => {
    it('should watch position successfully', async () => {
      const mockWatchId = 123;
      const onSuccess = vi.fn();
      const onError = vi.fn();

      mockGeolocation.watchPosition.mockReturnValue(mockWatchId);

      const watchId = await service.watchPosition(onSuccess, onError);

      expect(watchId).toBe(mockWatchId);
      expect(mockGeolocation.watchPosition).toHaveBeenCalledWith(
        expect.any(Function),
        expect.any(Function),
        expect.objectContaining({
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        })
      );
    });
  });

  describe('isGeolocationSupported', () => {
    it('should return true when geolocation is supported', () => {
      expect(service.isGeolocationSupported()).toBe(true);
    });

    it('should return false when geolocation is not supported', () => {
      const originalGeolocation = globalThis.navigator.geolocation;
      
      // Delete the geolocation property
      delete (globalThis.navigator as any).geolocation;

      service = new GeolocationService();
      expect(service.isGeolocationSupported()).toBe(false);
      
      // Restore for other tests
      (globalThis.navigator as any).geolocation = originalGeolocation;
    });
  });

  describe('calculateDistance', () => {
    it('should calculate distance between two points', () => {
      // Distance between Tokyo and Osaka (approximately 400km)
      const tokyoLat = 35.6762;
      const tokyoLon = 139.6503;
      const osakaLat = 34.6937;
      const osakaLon = 135.5023;

      const distance = service.calculateDistance(tokyoLat, tokyoLon, osakaLat, osakaLon);

      // Should be approximately 400km (allowing for some variance)
      expect(distance).toBeGreaterThan(390);
      expect(distance).toBeLessThan(410);
    });

    it('should return 0 for same coordinates', () => {
      const distance = service.calculateDistance(35.6762, 139.6503, 35.6762, 139.6503);
      expect(distance).toBe(0);
    });
  });

  describe('clearWatch', () => {
    it('should clear watch position', () => {
      const watchId = 123;
      service.clearWatch(watchId);

      expect(mockGeolocation.clearWatch).toHaveBeenCalledWith(watchId);
    });

    it('should handle missing geolocation', () => {
      Object.defineProperty(globalThis.navigator, 'geolocation', {
        value: undefined,
        writable: true,
        configurable: true
      });

      // Should not throw error
      expect(() => service.clearWatch(123)).not.toThrow();
    });
  });
});