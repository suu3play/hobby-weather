import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { WeatherCard } from './WeatherCard';
import type { WeatherData } from '../../types';

describe('WeatherCard', () => {
  const mockWeatherData: WeatherData = {
    id: 1,
    lat: 35.6762,
    lon: 139.6503,
    datetime: new Date('2024-01-15T12:00:00'),
    temperature: 25.5,
    feelsLike: 27.2,
    humidity: 65,
    pressure: 1013,
    visibility: 10000,
    windSpeed: 3.5,
    windDirection: 180,
    weatherType: 'clear',
    weatherDescription: '晴天',
    generatedAt: new Date('2024-01-15T12:00:00'),
    cloudiness: 0,
    uvIndex: 5.2,
    cachedAt: new Date('2024-01-15T12:00:00')
  };

  it('should render weather information correctly', () => {
    render(<WeatherCard weather={mockWeatherData} />);

    // Check basic weather info
    expect(screen.getByText('現在の天気')).toBeInTheDocument();
    expect(screen.getByText('晴天')).toBeInTheDocument();
    expect(screen.getByText('26')).toBeInTheDocument(); // Rounded temperature
    expect(screen.getByText('体感温度 27°C')).toBeInTheDocument();
  });

  it('should display weather details', () => {
    render(<WeatherCard weather={mockWeatherData} />);

    // Check weather details
    expect(screen.getByText('湿度')).toBeInTheDocument();
    expect(screen.getByText('65%')).toBeInTheDocument();
    
    expect(screen.getByText('風速')).toBeInTheDocument();
    expect(screen.getByText('3.5 m/s')).toBeInTheDocument();
    expect(screen.getByText('南')).toBeInTheDocument(); // Wind direction
    
    expect(screen.getByText('気圧')).toBeInTheDocument();
    expect(screen.getByText('1013 hPa')).toBeInTheDocument();
    
    expect(screen.getByText('視界')).toBeInTheDocument();
    expect(screen.getByText('10.0 km')).toBeInTheDocument();
    
    expect(screen.getByText('雲量')).toBeInTheDocument();
    expect(screen.getByText('0%')).toBeInTheDocument();
  });

  it('should show UV index when available', () => {
    render(<WeatherCard weather={mockWeatherData} />);

    expect(screen.getByText('UV指数')).toBeInTheDocument();
    expect(screen.getByText('5.2')).toBeInTheDocument();
    expect(screen.getByText('中程度')).toBeInTheDocument();
  });

  it('should not show UV index when zero', () => {
    const weatherWithoutUV: WeatherData = {
      ...mockWeatherData,
      uvIndex: 0
    };

    render(<WeatherCard weather={weatherWithoutUV} />);

    expect(screen.queryByText('UV指数')).not.toBeInTheDocument();
  });

  it('should format date and time correctly', () => {
    render(<WeatherCard weather={mockWeatherData} />);

    // Check if date is formatted (exact format might vary by locale)
    expect(screen.getByText(/1月/)).toBeInTheDocument();
    expect(screen.getByText(/15/)).toBeInTheDocument();
    
    // Check if time is formatted
    expect(screen.getByText(/12:00/)).toBeInTheDocument();
  });

  it('should handle different wind directions', () => {
    const windDirections = [
      { degrees: 0, expected: '北' },
      { degrees: 45, expected: '北東' },
      { degrees: 90, expected: '東' },
      { degrees: 135, expected: '南東' },
      { degrees: 180, expected: '南' },
      { degrees: 225, expected: '南西' },
      { degrees: 270, expected: '西' },
      { degrees: 315, expected: '北西' }
    ];

    windDirections.forEach(({ degrees, expected }) => {
      const weatherData = { ...mockWeatherData, windDirection: degrees };
      const { rerender } = render(<WeatherCard weather={weatherData} />);
      
      expect(screen.getByText(expected)).toBeInTheDocument();
      
      rerender(<div />); // Clean up
    });
  });

  it('should categorize UV index correctly', () => {
    const uvLevels = [
      { uvIndex: 1, expected: '弱い' },
      { uvIndex: 3, expected: '中程度' },
      { uvIndex: 6, expected: '強い' },
      { uvIndex: 8, expected: '非常に強い' },
      { uvIndex: 12, expected: '極端' }
    ];

    uvLevels.forEach(({ uvIndex, expected }) => {
      const weatherData = { ...mockWeatherData, uvIndex };
      const { rerender } = render(<WeatherCard weather={weatherData} />);
      
      expect(screen.getByText(expected)).toBeInTheDocument();
      
      rerender(<div />); // Clean up
    });
  });

  it('should apply custom className', () => {
    const { container } = render(
      <WeatherCard weather={mockWeatherData} className="custom-class" />
    );

    expect(container.firstChild).toHaveClass('custom-class');
  });
});