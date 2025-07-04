import { describe, it, expect } from 'vitest';
import { recommendationService } from './recommendation.service';
import type { Hobby, WeatherForecast, DailyForecast } from '../types';

describe('RecommendationService', () => {
  const mockHobbies: Hobby[] = [
    {
      id: 1,
      name: 'ハイキング',
      description: '山歩きを楽しむ',
      isActive: true,
      isOutdoor: true,
      preferredWeather: ['clear', 'clouds'],
      minTemperature: 15,
      maxTemperature: 25,
      createdAt: new Date('2024-01-01')
    },
    {
      id: 2,
      name: '読書',
      description: '室内で本を読む',
      isActive: true,
      isOutdoor: false,
      preferredWeather: ['rain', 'clouds'],
      minTemperature: 20,
      maxTemperature: 30,
      createdAt: new Date('2024-01-01')
    },
    {
      id: 3,
      name: 'ビーチバレー',
      description: '砂浜でスポーツ',
      isActive: true,
      isOutdoor: true,
      preferredWeather: ['clear'],
      minTemperature: 25,
      maxTemperature: 35,
      createdAt: new Date('2024-01-01')
    }
  ];

  const mockForecasts: DailyForecast[] = [
    {
      date: new Date('2024-01-15'),
      temperature: {
        min: 18,
        max: 24,
        morning: 20,
        day: 23,
        evening: 22,
        night: 19
      },
      feelsLike: {
        morning: 21,
        day: 25,
        evening: 24,
        night: 20
      },
      humidity: 65,
      pressure: 1015,
      windSpeed: 2.5,
      windDirection: 90,
      weatherType: 'clear',
      weatherDescription: '晴れ',
      cloudiness: 10,
      uvIndex: 6.5,
      pop: 0.1
    },
    {
      date: new Date('2024-01-16'),
      temperature: {
        min: 12,
        max: 18,
        morning: 14,
        day: 17,
        evening: 16,
        night: 13
      },
      feelsLike: {
        morning: 15,
        day: 19,
        evening: 18,
        night: 14
      },
      humidity: 80,
      pressure: 1010,
      windSpeed: 8.5,
      windDirection: 180,
      weatherType: 'rain',
      weatherDescription: '雨',
      cloudiness: 90,
      uvIndex: 2.0,
      pop: 0.8
    },
    {
      date: new Date('2024-01-17'),
      temperature: {
        min: 28,
        max: 35,
        morning: 30,
        day: 34,
        evening: 32,
        night: 29
      },
      feelsLike: {
        morning: 32,
        day: 38,
        evening: 35,
        night: 31
      },
      humidity: 45,
      pressure: 1020,
      windSpeed: 1.5,
      windDirection: 45,
      weatherType: 'clear',
      weatherDescription: '快晴',
      cloudiness: 0,
      uvIndex: 9.5,
      pop: 0.0
    }
  ];

  const mockWeatherForecast: WeatherForecast = {
    id: 1,
    lat: 35.6762,
    lon: 139.6503,
    forecasts: mockForecasts,
    generatedAt: new Date('2024-01-14T12:00:00')
  };

  describe('generateRecommendations', () => {
    it('should generate recommendations for all hobbies', async () => {
      const recommendations = await recommendationService.generateRecommendations(
        mockHobbies,
        mockWeatherForecast
      );

      expect(recommendations).toHaveLength(3);
      expect(recommendations.every(r => r.hobby && r.recommendedDays && r.overallScore >= 0)).toBe(true);
    });

    it('should sort recommendations by overall score', async () => {
      const recommendations = await recommendationService.generateRecommendations(
        mockHobbies,
        mockWeatherForecast
      );

      for (let i = 0; i < recommendations.length - 1; i++) {
        expect(recommendations[i].overallScore).toBeGreaterThanOrEqual(
          recommendations[i + 1].overallScore
        );
      }
    });

    it('should calculate correct scores for outdoor activities', async () => {
      const outdoorHobbies = mockHobbies.filter(h => h.isOutdoor);
      const recommendations = await recommendationService.generateRecommendations(
        outdoorHobbies,
        mockWeatherForecast
      );

      const hikingRec = recommendations.find(r => r.hobby.name === 'ハイキング');
      const beachVolleyRec = recommendations.find(r => r.hobby.name === 'ビーチバレー');

      expect(hikingRec).toBeDefined();
      expect(beachVolleyRec).toBeDefined();

      // ハイキングは1日目（適温・晴れ）で高スコアになるはず
      const hikingBestDay = hikingRec!.recommendedDays[0];
      expect(hikingBestDay.date.toDateString()).toBe(mockForecasts[0].date.toDateString());
      expect(hikingBestDay.score).toBeGreaterThan(70);

      // ビーチバレーは3日目（高温・晴れ）で高スコアになるはず
      const beachBestDay = beachVolleyRec!.recommendedDays[0];
      expect(beachBestDay.date.toDateString()).toBe(mockForecasts[2].date.toDateString());
    });

    it('should handle indoor activities appropriately', async () => {
      const indoorHobbies = mockHobbies.filter(h => !h.isOutdoor);
      const recommendations = await recommendationService.generateRecommendations(
        indoorHobbies,
        mockWeatherForecast
      );

      const readingRec = recommendations.find(r => r.hobby.name === '読書');
      expect(readingRec).toBeDefined();

      // 読書は雨の日（2日目）で高スコアになるはず
      const readingBestDay = readingRec!.recommendedDays[0];
      expect(readingBestDay.date.toDateString()).toBe(mockForecasts[1].date.toDateString());
    });

    it('should apply filters correctly', async () => {
      const filters = {
        minScore: 60,
        weatherTypes: ['clear' as const]
      };

      const recommendations = await recommendationService.generateRecommendations(
        mockHobbies,
        mockWeatherForecast,
        filters
      );

      // 全ての推薦日が最小スコアを満たしているか
      recommendations.forEach(rec => {
        rec.recommendedDays.forEach(day => {
          expect(day.score).toBeGreaterThanOrEqual(60);
        });
      });

      // 天気タイプフィルターが適用されているか
      recommendations.forEach(rec => {
        rec.recommendedDays.forEach(day => {
          expect(day.forecast.weatherType).toBe('clear');
        });
      });
    });

    it('should exclude weekends when filter is applied', async () => {
      // 日曜日（1/14の次の日曜日）を含む予報を作成
      const sundayForecast: DailyForecast = {
        ...mockForecasts[0],
        date: new Date('2024-01-21') // 日曜日
      };

      const forecastWithWeekend: WeatherForecast = {
        ...mockWeatherForecast,
        forecasts: [...mockForecasts, sundayForecast]
      };

      const filters = { excludeWeekends: true };
      const recommendations = await recommendationService.generateRecommendations(
        mockHobbies,
        forecastWithWeekend,
        filters
      );

      // 週末が除外されているか確認
      recommendations.forEach(rec => {
        rec.recommendedDays.forEach(day => {
          const dayOfWeek = day.date.getDay();
          expect(dayOfWeek).not.toBe(0); // 日曜日ではない
          expect(dayOfWeek).not.toBe(6); // 土曜日ではない
        });
      });
    });
  });

  describe('score calculation', () => {
    it('should give high scores for perfect weather matches', async () => {
      const perfectWeatherHobby: Hobby = {
        id: 4,
        name: 'テスト趣味',
        description: '',
        isActive: true,
        isOutdoor: true,
        preferredWeather: ['clear'],
        minTemperature: 20,
        maxTemperature: 25,
        createdAt: new Date()
      };

      const recommendations = await recommendationService.generateRecommendations(
        [perfectWeatherHobby],
        mockWeatherForecast
      );

      const bestDay = recommendations[0].recommendedDays[0];
      expect(bestDay.score).toBeGreaterThan(80);
    });

    it('should penalize rain for outdoor activities', async () => {
      const outdoorHobby: Hobby = {
        id: 5,
        name: '屋外スポーツ',
        description: '',
        isActive: true,
        isOutdoor: true,
        preferredWeather: ['clear'],
        minTemperature: 10,
        maxTemperature: 30,
        createdAt: new Date()
      };

      const recommendations = await recommendationService.generateRecommendations(
        [outdoorHobby],
        mockWeatherForecast
      );

      const rainyDay = recommendations[0].recommendedDays.find(
        day => day.forecast.weatherType === 'rain'
      );

      if (rainyDay) {
        expect(rainyDay.score).toBeLessThan(50);
      }
    });

    it('should handle temperature preferences correctly', async () => {
      const coldWeatherHobby: Hobby = {
        id: 6,
        name: 'スキー',
        description: '',
        isActive: true,
        isOutdoor: true,
        preferredWeather: ['snow'],
        minTemperature: -10,
        maxTemperature: 5,
        createdAt: new Date()
      };

      const recommendations = await recommendationService.generateRecommendations(
        [coldWeatherHobby],
        mockWeatherForecast
      );

      // 全ての日が気温範囲外なので、スコアは低くなるはず
      recommendations[0].recommendedDays.forEach(day => {
        expect(day.score).toBeLessThan(60);
      });
    });
  });

  describe('factor analysis', () => {
    it('should identify matching factors correctly', async () => {
      const recommendations = await recommendationService.generateRecommendations(
        [mockHobbies[0]], // ハイキング
        mockWeatherForecast
      );

      const clearDay = recommendations[0].recommendedDays.find(
        day => day.forecast.weatherType === 'clear'
      );

      expect(clearDay).toBeDefined();
      expect(clearDay!.matchingFactors.length).toBeGreaterThan(0);
      expect(clearDay!.matchingFactors.some(factor => 
        factor.includes('晴') || factor.includes('好適')
      )).toBe(true);
    });

    it('should identify warning factors for extreme conditions', async () => {
      const recommendations = await recommendationService.generateRecommendations(
        [mockHobbies[0]], // ハイキング（適温15-25度）
        mockWeatherForecast
      );

      const hotDay = recommendations[0].recommendedDays.find(
        day => day.forecast.temperature.max > 30
      );

      if (hotDay) {
        expect(hotDay.warningFactors.length).toBeGreaterThan(0);
        expect(hotDay.warningFactors.some(factor => 
          factor.includes('高温') || factor.includes('注意')
        )).toBe(true);
      }
    });
  });

  describe('top recommendations', () => {
    it('should return correct number of top recommendations', async () => {
      const topRecs = await recommendationService.getTopRecommendations(
        mockHobbies,
        mockWeatherForecast,
        2
      );

      expect(topRecs).toHaveLength(2);
      expect(topRecs[0].overallScore).toBeGreaterThanOrEqual(topRecs[1].overallScore);
    });
  });

  describe('date-specific recommendations', () => {
    it('should return recommendations for specific date', async () => {
      const targetDate = new Date('2024-01-15');
      const dateRecs = await recommendationService.getRecommendationsForDate(
        mockHobbies,
        mockWeatherForecast,
        targetDate
      );

      dateRecs.forEach(rec => {
        expect(rec.recommendedDays).toHaveLength(1);
        expect(rec.recommendedDays[0].date.toDateString()).toBe(targetDate.toDateString());
      });
    });
  });
});