import { render, screen, fireEvent, waitFor } from '../../test-utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HobbyForm } from './HobbyForm';
import type { Hobby } from '../../types';

describe('HobbyForm', () => {
  const mockOnSubmit = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render form fields', () => {
    render(
      <HobbyForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByLabelText(/趣味名/)).toBeInTheDocument();
    expect(screen.getByLabelText(/説明/)).toBeInTheDocument();
    expect(screen.getByText(/希望天気/)).toBeInTheDocument();
    expect(screen.getByText(/活動時間帯/)).toBeInTheDocument();
    expect(screen.getByLabelText(/この趣味を有効にする/)).toBeInTheDocument();
  });

  it('should submit valid form data', async () => {
    render(
      <HobbyForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    // Fill in form
    fireEvent.change(screen.getByLabelText(/趣味名/), {
      target: { value: 'ランニング' }
    });

    fireEvent.change(screen.getByLabelText(/説明/), {
      target: { value: '健康のために走ります' }
    });

    // Add weather condition
    const clearWeatherButton = screen.getByText('晴れ');
    fireEvent.click(clearWeatherButton);

    // Submit form
    fireEvent.click(screen.getByText('作成'));

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        name: 'ランニング',
        description: '健康のために走ります',
        preferredWeather: [{ condition: 'clear', weight: 5 }],
        preferredTimeOfDay: [],
        isActive: true,
        isOutdoor: true
      });
    });
  });

  it('should show validation errors', async () => {
    render(
      <HobbyForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    // Submit empty form
    fireEvent.click(screen.getByText('作成'));

    await waitFor(() => {
      expect(screen.getByText('趣味名は必須です')).toBeInTheDocument();
      expect(screen.getByText('希望天気を少なくとも1つ選択してください')).toBeInTheDocument();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('should populate form with existing hobby data', () => {
    const existingHobby: Hobby = {
      id: 1,
      name: 'サイクリング',
      description: '自転車で楽しく移動',
      preferredWeather: [
        { condition: 'clear', weight: 9 },
        { condition: 'clouds', weight: 7 }
      ],
      preferredTimeOfDay: ['morning', 'evening'],
      isActive: false,
      isOutdoor: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    render(
      <HobbyForm
        hobby={existingHobby}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByDisplayValue('サイクリング')).toBeInTheDocument();
    expect(screen.getByDisplayValue('自転車で楽しく移動')).toBeInTheDocument();
    expect(screen.getByText('晴れ')).toBeInTheDocument();
    expect(screen.getByText('曇り')).toBeInTheDocument();
    expect(screen.getByLabelText(/この趣味を有効にする/)).not.toBeChecked();
  });

  it('should handle weather condition management', () => {
    render(
      <HobbyForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    // Add weather condition
    const clearWeatherButton = screen.getByText('晴れ');
    fireEvent.click(clearWeatherButton);

    // Check that weather condition was added
    expect(screen.getByDisplayValue('5')).toBeInTheDocument(); // default weight

    // Update weight
    fireEvent.change(screen.getByDisplayValue('5'), {
      target: { value: '8' }
    });

    expect(screen.getByDisplayValue('8')).toBeInTheDocument();

    // Remove weather condition
    const removeButton = screen.getByText('✕');
    fireEvent.click(removeButton);

    // Weather condition should be removed
    expect(screen.queryByDisplayValue('8')).not.toBeInTheDocument();
  });

  it('should prevent adding duplicate weather conditions', () => {
    render(
      <HobbyForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const clearWeatherButton = screen.getByText('晴れ');
    
    // Add weather condition
    fireEvent.click(clearWeatherButton);
    
    // Try to add the same condition again
    fireEvent.click(clearWeatherButton);

    // Should only have one condition
    const weightSelects = screen.getAllByDisplayValue('5');
    expect(weightSelects).toHaveLength(1);
  });

  it('should handle character limits', () => {
    render(
      <HobbyForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const nameInput = screen.getByLabelText(/趣味名/) as HTMLInputElement;
    const descriptionInput = screen.getByLabelText(/説明/) as HTMLTextAreaElement;

    expect(nameInput.maxLength).toBe(50);
    expect(descriptionInput.maxLength).toBe(200);

    // Test character counter for description
    fireEvent.change(descriptionInput, {
      target: { value: 'テスト説明' }
    });

    expect(screen.getByText('5/200文字')).toBeInTheDocument();
  });

  it('should call onCancel when cancel button is clicked', () => {
    render(
      <HobbyForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    fireEvent.click(screen.getByText('キャンセル'));
    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('should show loading state', () => {
    render(
      <HobbyForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        isLoading={true}
      />
    );

    const submitButton = screen.getByText('保存中...');
    expect(submitButton).toBeDisabled();
  });

  it('should show update button text for existing hobby', () => {
    const existingHobby: Hobby = {
      id: 1,
      name: 'サイクリング',
      preferredWeather: [{ condition: 'clear', weight: 5 }],
      preferredTimeOfDay: [],
      isActive: true,
      isOutdoor: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    render(
      <HobbyForm
        hobby={existingHobby}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText('更新')).toBeInTheDocument();
  });
});