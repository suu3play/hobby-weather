import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useHobby, validateHobby, createWeatherCondition } from './useHobby';
import type { Hobby } from '../types';

// Mock database service
vi.mock('../services/database.service', () => ({
  databaseService: {
    getAllHobbies: vi.fn(),
    getActiveHobbies: vi.fn(),
    createHobby: vi.fn(),
    updateHobby: vi.fn(),
    deleteHobby: vi.fn(),
  }
}));

import { databaseService } from '../services/database.service';

describe('useHobby', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock default empty responses
    (databaseService.getAllHobbies as any).mockResolvedValue([]);
    (databaseService.getActiveHobbies as any).mockResolvedValue([]);
  });

  it('should initialize with default state', async () => {
    const { result } = renderHook(() => useHobby());

    expect(result.current.hobbies).toEqual([]);
    expect(result.current.activeHobbies).toEqual([]);
    expect(result.current.error).toBeNull();
    
    // Wait for the useEffect to complete to avoid act warnings
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    // After loading completes, isLoading should be false
    expect(result.current.isLoading).toBe(false);
  });

  it('should load hobbies on mount', async () => {
    const mockHobbies: Hobby[] = [
      {
        id: 1,
        name: 'ランニング',
        preferredWeather: [{ condition: 'clear', weight: 10 }],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    const mockActiveHobbies: Hobby[] = [mockHobbies[0]];

    (databaseService.getAllHobbies as any).mockResolvedValue(mockHobbies);
    (databaseService.getActiveHobbies as any).mockResolvedValue(mockActiveHobbies);

    const { result } = renderHook(() => useHobby());

    // Wait for async initialization
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.hobbies).toEqual(mockHobbies);
    expect(result.current.activeHobbies).toEqual(mockActiveHobbies);
    expect(result.current.isLoading).toBe(false);
  });

  it('should create a new hobby', async () => {
    const newHobby = {
      name: 'サイクリング',
      preferredWeather: [{ condition: 'clear' as const, weight: 8 }],
      isActive: true
    };

    (databaseService.createHobby as any).mockResolvedValue(1);
    (databaseService.getAllHobbies as any).mockResolvedValue([]);
    (databaseService.getActiveHobbies as any).mockResolvedValue([]);

    const { result } = renderHook(() => useHobby());

    await act(async () => {
      await result.current.createHobby(newHobby);
    });

    expect(databaseService.createHobby).toHaveBeenCalledWith(newHobby);
    expect(databaseService.getAllHobbies).toHaveBeenCalled();
    expect(databaseService.getActiveHobbies).toHaveBeenCalled();
  });

  it('should update an existing hobby', async () => {
    const updates = { name: '更新された趣味' };

    (databaseService.updateHobby as any).mockResolvedValue(1);
    (databaseService.getAllHobbies as any).mockResolvedValue([]);
    (databaseService.getActiveHobbies as any).mockResolvedValue([]);

    const { result } = renderHook(() => useHobby());

    await act(async () => {
      await result.current.updateHobby(1, updates);
    });

    expect(databaseService.updateHobby).toHaveBeenCalledWith(1, updates);
  });

  it('should delete a hobby', async () => {
    (databaseService.deleteHobby as any).mockResolvedValue(undefined);
    (databaseService.getAllHobbies as any).mockResolvedValue([]);
    (databaseService.getActiveHobbies as any).mockResolvedValue([]);

    const { result } = renderHook(() => useHobby());

    await act(async () => {
      await result.current.deleteHobby(1);
    });

    expect(databaseService.deleteHobby).toHaveBeenCalledWith(1);
  });

  it('should toggle hobby active status', async () => {
    const mockHobby: Hobby = {
      id: 1,
      name: 'ランニング',
      preferredWeather: [{ condition: 'clear', weight: 10 }],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    (databaseService.getAllHobbies as any).mockResolvedValue([mockHobby]);
    (databaseService.getActiveHobbies as any).mockResolvedValue([mockHobby]);
    (databaseService.updateHobby as any).mockResolvedValue(1);

    const { result } = renderHook(() => useHobby());

    // Wait for initial load
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    await act(async () => {
      await result.current.toggleHobbyActive(1);
    });

    expect(databaseService.updateHobby).toHaveBeenCalledWith(1, { isActive: false });
  });

  it('should handle errors', async () => {
    const error = new Error('Database error');
    (databaseService.getAllHobbies as any).mockRejectedValue(error);

    const { result } = renderHook(() => useHobby());

    // Wait for async initialization
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.error).toBe('Database error');
    expect(result.current.isLoading).toBe(false);
  });

  it('should clear errors', async () => {
    const { result } = renderHook(() => useHobby());

    // Wait for initial load to complete
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBeNull();
  });
});

describe('validateHobby', () => {
  it('should validate hobby correctly', () => {
    const validHobby = {
      name: 'ランニング',
      preferredWeather: [{ condition: 'clear' as const, weight: 5 }],
      isActive: true
    };

    const errors = validateHobby(validHobby);
    expect(errors).toHaveLength(0);
  });

  it('should return errors for invalid hobby', () => {
    const invalidHobby = {
      name: '',
      preferredWeather: [],
      isActive: true
    };

    const errors = validateHobby(invalidHobby);
    expect(errors).toContain('趣味名は必須です');
    expect(errors).toContain('希望天気を少なくとも1つ選択してください');
  });

  it('should validate name length', () => {
    const hobbyWithLongName = {
      name: 'a'.repeat(51),
      preferredWeather: [{ condition: 'clear' as const, weight: 5 }],
      isActive: true
    };

    const errors = validateHobby(hobbyWithLongName);
    expect(errors).toContain('趣味名は50文字以内で入力してください');
  });

  it('should validate description length', () => {
    const hobbyWithLongDescription = {
      name: 'ランニング',
      description: 'a'.repeat(201),
      preferredWeather: [{ condition: 'clear' as const, weight: 5 }],
      isActive: true
    };

    const errors = validateHobby(hobbyWithLongDescription);
    expect(errors).toContain('説明は200文字以内で入力してください');
  });

  it('should validate weather condition weights', () => {
    const hobbyWithInvalidWeights = {
      name: 'ランニング',
      preferredWeather: [
        { condition: 'clear' as const, weight: 0 },
        { condition: 'rain' as const, weight: 11 }
      ],
      isActive: true
    };

    const errors = validateHobby(hobbyWithInvalidWeights);
    expect(errors).toContain('天気条件1のスコアは1-10の範囲で設定してください');
    expect(errors).toContain('天気条件2のスコアは1-10の範囲で設定してください');
  });
});

describe('createWeatherCondition', () => {
  it('should create weather condition with default weight', () => {
    const condition = createWeatherCondition('clear');
    expect(condition).toEqual({ condition: 'clear', weight: 5 });
  });

  it('should create weather condition with specified weight', () => {
    const condition = createWeatherCondition('rain', 8);
    expect(condition).toEqual({ condition: 'rain', weight: 8 });
  });

  it('should clamp weight to valid range', () => {
    const lowCondition = createWeatherCondition('clear', 0);
    expect(lowCondition.weight).toBe(1);

    const highCondition = createWeatherCondition('clear', 15);
    expect(highCondition.weight).toBe(10);
  });
});