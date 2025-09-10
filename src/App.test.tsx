import { render, screen } from './test-utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import App from './App';

describe('App', () => {
  beforeEach(() => {
    // Mock fetch to prevent API calls in tests
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ name: 'Test', weather: [{ description: 'Test' }], main: { temp: 20 } }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    );
  });

  it('renders the application title', () => {
    render(<App />);
    expect(screen.getByText('趣味予報')).toBeInTheDocument();
  });

  it('renders the application subtitle', () => {
    render(<App />);
    expect(screen.getByText('hobby-weather')).toBeInTheDocument();
  });

  it('shows navigation tabs', () => {
    render(<App />);
    expect(screen.getByText('おすすめ')).toBeInTheDocument();
    expect(screen.getByText('天気')).toBeInTheDocument();
    expect(screen.getByText('趣味管理')).toBeInTheDocument();
  });
});