import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ForecastCard } from './ForecastCard';
import type { DailyForecast } from '../../types';

describe('ForecastCard', () => {
  const mockForecast: DailyForecast = {
    date: new Date('2024-01-15T00:00:00'),
    temperature: {
      min: 15,
      max: 25,
      morning: 18,
      day: 24,
      evening: 22,
      night: 16
    },
    feelsLike: {
      morning: 20,
      day: 26,
      evening: 24,
      night: 18
    },
    humidity: 60,
    pressure: 1015,
    windSpeed: 2.5,
    windDirection: 90,
    weatherType: 'clear',
    weatherDescription: '晴れ',
    cloudiness: 10,
    uvIndex: 6.5,
    pop: 0.2
  };

  it('should render forecast information correctly', () => {
    render(<ForecastCard forecast={mockForecast} />);

    // Check temperature
    expect(screen.getByText('25°')).toBeInTheDocument(); // Max temp
    expect(screen.getByText('15°')).toBeInTheDocument(); // Min temp
    expect(screen.getByText('最高/最低')).toBeInTheDocument();

    // Check weather description
    expect(screen.getByText('晴れ')).toBeInTheDocument();

    // Check additional info
    expect(screen.getByText('湿度')).toBeInTheDocument();
    expect(screen.getByText('60%')).toBeInTheDocument();
    
    expect(screen.getByText('風速')).toBeInTheDocument();
    expect(screen.getByText('2.5 m/s')).toBeInTheDocument();
    
    expect(screen.getByText('UV指数')).toBeInTheDocument();
    expect(screen.getByText('6.5')).toBeInTheDocument();
  });

  it('should show precipitation probability when present', () => {
    render(<ForecastCard forecast={mockForecast} />);

    expect(screen.getByText('20%')).toBeInTheDocument();
    expect(screen.getByText('降水確率')).toBeInTheDocument();
  });

  it('should not show precipitation when zero', () => {
    const forecastWithoutPrecipitation = { ...mockForecast, pop: 0 };
    render(<ForecastCard forecast={forecastWithoutPrecipitation} />);

    expect(screen.queryByText('降水確率')).not.toBeInTheDocument();
  });

  it('should show time-specific temperatures', () => {
    render(<ForecastCard forecast={mockForecast} />);

    expect(screen.getByText('朝')).toBeInTheDocument();
    expect(screen.getByText('18°')).toBeInTheDocument(); // Morning temp

    expect(screen.getByText('昼')).toBeInTheDocument();
    expect(screen.getByText('24°')).toBeInTheDocument(); // Day temp

    expect(screen.getByText('夕')).toBeInTheDocument();
    expect(screen.getByText('22°')).toBeInTheDocument(); // Evening temp

    expect(screen.getByText('夜')).toBeInTheDocument();
    expect(screen.getByText('16°')).toBeInTheDocument(); // Night temp
  });

  it('should display "今日" for today', () => {
    const today = new Date();
    const todayForecast = { ...mockForecast, date: today };
    
    render(<ForecastCard forecast={todayForecast} isToday={true} />);

    expect(screen.getByText('今日')).toBeInTheDocument();
  });

  it('should display "明日" for tomorrow', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowForecast = { ...mockForecast, date: tomorrow };
    
    render(<ForecastCard forecast={tomorrowForecast} />);

    expect(screen.getByText('明日')).toBeInTheDocument();
  });

  it('should display formatted date for other days', () => {
    const futureDate = new Date('2024-01-20T00:00:00');
    const futureForecast = { ...mockForecast, date: futureDate };
    
    render(<ForecastCard forecast={futureForecast} />);

    // Should show month and day (exact format may vary)
    expect(screen.getByText(/1月/)).toBeInTheDocument();
    expect(screen.getByText(/20/)).toBeInTheDocument();
  });

  it('should apply today styling when isToday is true', () => {
    const { container } = render(
      <ForecastCard forecast={mockForecast} isToday={true} />
    );

    const cardElement = container.firstChild as HTMLElement;
    expect(cardElement).toHaveClass('border-blue-300', 'bg-blue-50');
  });

  it('should apply normal styling when isToday is false', () => {
    const { container } = render(
      <ForecastCard forecast={mockForecast} isToday={false} />
    );

    const cardElement = container.firstChild as HTMLElement;
    expect(cardElement).toHaveClass('border-gray-200');
    expect(cardElement).not.toHaveClass('border-blue-300', 'bg-blue-50');
  });

  it('should not show UV index when zero', () => {
    const forecastWithoutUV = { ...mockForecast, uvIndex: 0 };
    render(<ForecastCard forecast={forecastWithoutUV} />);

    expect(screen.queryByText('UV指数')).not.toBeInTheDocument();
  });
});