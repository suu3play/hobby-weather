export interface GeolocationPosition {
  lat: number;
  lon: number;
  accuracy?: number;
}

export interface GeolocationError {
  code: number;
  message: string;
}

export class GeolocationService {
  async getCurrentPosition(): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject({
          code: 0,
          message: 'このブラウザは位置情報をサポートしていません'
        });
        return;
      }

      const options: PositionOptions = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes cache
      };

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lon: position.coords.longitude,
            accuracy: position.coords.accuracy
          });
        },
        (error) => {
          const errorMessages: Record<number, string> = {
            1: '位置情報の取得が拒否されました',
            2: '位置情報を取得できませんでした',
            3: '位置情報の取得がタイムアウトしました'
          };

          reject({
            code: error.code,
            message: errorMessages[error.code] || '位置情報の取得に失敗しました'
          });
        },
        options
      );
    });
  }

  async watchPosition(
    onSuccess: (position: GeolocationPosition) => void,
    onError: (error: GeolocationError) => void
  ): Promise<number> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject({
          code: 0,
          message: 'このブラウザは位置情報をサポートしていません'
        });
        return;
      }

      const options: PositionOptions = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000 // 1 minute cache for watching
      };

      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          onSuccess({
            lat: position.coords.latitude,
            lon: position.coords.longitude,
            accuracy: position.coords.accuracy
          });
        },
        (error) => {
          const errorMessages: Record<number, string> = {
            1: '位置情報の取得が拒否されました',
            2: '位置情報を取得できませんでした',
            3: '位置情報の取得がタイムアウトしました'
          };

          onError({
            code: error.code,
            message: errorMessages[error.code] || '位置情報の取得に失敗しました'
          });
        },
        options
      );

      resolve(watchId);
    });
  }

  clearWatch(watchId: number): void {
    if (navigator.geolocation) {
      navigator.geolocation.clearWatch(watchId);
    }
  }

  isGeolocationSupported(): boolean {
    return 'geolocation' in navigator;
  }

  async checkPermission(): Promise<PermissionState> {
    if (!navigator.permissions) {
      // Permissions API not supported, assume granted if geolocation is available
      return this.isGeolocationSupported() ? 'granted' : 'denied';
    }

    try {
      const permission = await navigator.permissions.query({ name: 'geolocation' });
      return permission.state;
    } catch (error) {
      // Permission query failed, try to get position to check permission
      try {
        await this.getCurrentPosition();
        return 'granted';
      } catch {
        return 'denied';
      }
    }
  }

  async requestPermission(): Promise<GeolocationPosition> {
    // Requesting permission by attempting to get current position
    return this.getCurrentPosition();
  }

  // Helper method to get distance between two points using Haversine formula
  calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
      Math.cos(this.toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}

export const geolocationService = new GeolocationService();