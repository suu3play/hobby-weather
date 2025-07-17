import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import type { ThemeMode } from '../../types/theme';

export const ThemeSettings: React.FC = () => {
  const {
    config,
    currentTheme,
    systemPreference,
    setMode,
    setHighContrast,
    setReducedMotion,
    setFontSize,
  } = useTheme();

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-text-primary mb-4">
          テーマ設定
        </h3>
        
        {/* テーマモード選択 */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-text-secondary">
            外観モード
          </label>
          <div className="grid grid-cols-1 gap-2">
            {(['light', 'dark', 'system'] as ThemeMode[]).map((mode) => (
              <label
                key={mode}
                className="flex items-center gap-3 p-3 rounded-lg border border-border-primary cursor-pointer hover:bg-surface-secondary transition-colors"
              >
                <input
                  type="radio"
                  name="theme-mode"
                  value={mode}
                  checked={config.mode === mode}
                  onChange={() => setMode(mode)}
                  className="text-primary-500 focus:ring-primary-500"
                />
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 flex-shrink-0">
                    {mode === 'light' && (
                      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-text-primary">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    )}
                    {mode === 'dark' && (
                      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-text-primary">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                      </svg>
                    )}
                    {mode === 'system' && (
                      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-text-primary">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    )}
                  </span>
                  <div>
                    <div className="text-sm font-medium text-text-primary">
                      {mode === 'light' && 'ライトモード'}
                      {mode === 'dark' && 'ダークモード'}
                      {mode === 'system' && 'システム設定に従う'}
                    </div>
                    <div className="text-xs text-text-tertiary">
                      {mode === 'light' && '常に明るいテーマを使用'}
                      {mode === 'dark' && '常に暗いテーマを使用'}
                      {mode === 'system' && `システム設定: ${systemPreference === 'dark' ? 'ダーク' : 'ライト'}モード`}
                    </div>
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* 現在のテーマ情報 */}
        <div className="mt-4 p-3 bg-surface-secondary rounded-lg">
          <div className="text-xs text-text-tertiary mb-1">現在のテーマ</div>
          <div className="text-sm font-medium text-text-primary">
            {currentTheme.name} - {currentTheme.mode === 'dark' ? 'ダーク' : 'ライト'}モード
          </div>
        </div>
      </div>

      {/* アクセシビリティ設定 */}
      <div>
        <h4 className="text-base font-semibold text-text-primary mb-3">
          アクセシビリティ
        </h4>
        
        <div className="space-y-4">
          {/* 高コントラストモード */}
          <label className="flex items-center justify-between p-3 rounded-lg border border-border-primary cursor-pointer hover:bg-surface-secondary transition-colors">
            <div>
              <div className="text-sm font-medium text-text-primary">
                高コントラストモード
              </div>
              <div className="text-xs text-text-tertiary">
                視認性を向上させるため、より強いコントラストを使用
              </div>
            </div>
            <input
              type="checkbox"
              checked={config.highContrast}
              onChange={(e) => setHighContrast(e.target.checked)}
              className="text-primary-500 focus:ring-primary-500"
            />
          </label>

          {/* 動きの軽減 */}
          <label className="flex items-center justify-between p-3 rounded-lg border border-border-primary cursor-pointer hover:bg-surface-secondary transition-colors">
            <div>
              <div className="text-sm font-medium text-text-primary">
                動きの軽減
              </div>
              <div className="text-xs text-text-tertiary">
                アニメーションと視覚効果を最小限に抑制
              </div>
            </div>
            <input
              type="checkbox"
              checked={config.reducedMotion}
              onChange={(e) => setReducedMotion(e.target.checked)}
              className="text-primary-500 focus:ring-primary-500"
            />
          </label>

          {/* フォントサイズ */}
          <div className="p-3 rounded-lg border border-border-primary">
            <div className="text-sm font-medium text-text-primary mb-2">
              フォントサイズ
            </div>
            <div className="grid grid-cols-3 gap-2">
              {(['small', 'medium', 'large'] as const).map((size) => (
                <label
                  key={size}
                  className="flex items-center justify-center p-2 rounded border border-border-secondary cursor-pointer hover:bg-surface-secondary transition-colors"
                >
                  <input
                    type="radio"
                    name="font-size"
                    value={size}
                    checked={config.fontSize === size}
                    onChange={() => setFontSize(size)}
                    className="sr-only"
                  />
                  <span className={`text-xs font-medium ${
                    config.fontSize === size 
                      ? 'text-primary-600' 
                      : 'text-text-secondary'
                  }`}>
                    {size === 'small' && '小'}
                    {size === 'medium' && '中'}
                    {size === 'large' && '大'}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* テーマプレビュー */}
      <div>
        <h4 className="text-base font-semibold text-text-primary mb-3">
          プレビュー
        </h4>
        
        <div className="p-4 rounded-lg border border-border-primary bg-surface-secondary">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="w-full h-8 bg-primary-500 rounded" title="プライマリカラー" />
              <div className="w-full h-6 bg-secondary-500 rounded" title="セカンダリカラー" />
              <div className="w-full h-6 bg-accent-500 rounded" title="アクセントカラー" />
            </div>
            <div className="space-y-2">
              <div className="p-2 bg-surface-primary border border-border-primary rounded">
                <div className="text-xs text-text-primary">サンプルテキスト</div>
                <div className="text-2xs text-text-secondary">詳細テキスト</div>
              </div>
              <div className="flex gap-1">
                <div className="w-4 h-4 bg-success-500 rounded-sm" title="成功" />
                <div className="w-4 h-4 bg-warning-500 rounded-sm" title="警告" />
                <div className="w-4 h-4 bg-error-500 rounded-sm" title="エラー" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};