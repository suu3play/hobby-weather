import type { WeatherType, TimeOfDay } from '../types';

export interface HobbySuggestion {
  name: string;
  category: string;
  categoryIcon: string;
  isOutdoor: boolean;
  defaultWeather?: WeatherType[];
  defaultTimeOfDay?: TimeOfDay[];
  description?: string;
}

// 趣味候補データ
export const HOBBY_SUGGESTIONS: HobbySuggestion[] = [
  // 🌿 自然系アウトドア
  {
    name: 'キャンプ',
    category: '自然系アウトドア',
    categoryIcon: '🌿',
    isOutdoor: true,
    defaultWeather: ['clear', 'clouds'],
    defaultTimeOfDay: ['evening', 'night'],
    description: 'テント泊や焚き火を楽しむアウトドア活動'
  },
  {
    name: 'トレッキング',
    category: '自然系アウトドア',
    categoryIcon: '🌿',
    isOutdoor: true,
    defaultWeather: ['clear', 'clouds'],
    defaultTimeOfDay: ['morning', 'day'],
    description: '自然の中を歩く健康的なアクティビティ'
  },
  {
    name: '登山',
    category: '自然系アウトドア',
    categoryIcon: '🌿',
    isOutdoor: true,
    defaultWeather: ['clear'],
    defaultTimeOfDay: ['morning', 'day'],
    description: '山頂を目指すチャレンジングな活動'
  },
  {
    name: '天体観測（星空観察）',
    category: '自然系アウトドア',
    categoryIcon: '🌿',
    isOutdoor: true,
    defaultWeather: ['clear'],
    defaultTimeOfDay: ['night'],
    description: '星座や天体を観察する静寂な趣味'
  },
  {
    name: 'バードウォッチング（野鳥観察）',
    category: '自然系アウトドア',
    categoryIcon: '🌿',
    isOutdoor: true,
    defaultWeather: ['clear', 'clouds'],
    defaultTimeOfDay: ['morning', 'evening'],
    description: '野鳥の生態を観察する自然愛好活動'
  },
  {
    name: '植物観察（花・きのこなど）',
    category: '自然系アウトドア',
    categoryIcon: '🌿',
    isOutdoor: true,
    defaultWeather: ['clear', 'clouds', 'drizzle'],
    defaultTimeOfDay: ['morning', 'day'],
    description: '季節の植物や菌類を観察・撮影'
  },

  // 🏔 アクティブ系アウトドア
  {
    name: 'スノーボード',
    category: 'アクティブ系アウトドア',
    categoryIcon: '🏔',
    isOutdoor: true,
    defaultWeather: ['snow', 'clouds'],
    defaultTimeOfDay: ['morning', 'day'],
    description: '雪山で楽しむウィンタースポーツ'
  },
  {
    name: 'スキー',
    category: 'アクティブ系アウトドア',
    categoryIcon: '🏔',
    isOutdoor: true,
    defaultWeather: ['snow', 'clouds'],
    defaultTimeOfDay: ['morning', 'day'],
    description: '伝統的なウィンタースポーツ'
  },
  {
    name: 'カヤック',
    category: 'アクティブ系アウトドア',
    categoryIcon: '🏔',
    isOutdoor: true,
    defaultWeather: ['clear', 'clouds'],
    defaultTimeOfDay: ['morning', 'day'],
    description: 'パドルで水上を進むウォータースポーツ'
  },
  {
    name: 'カヌー',
    category: 'アクティブ系アウトドア',
    categoryIcon: '🏔',
    isOutdoor: true,
    defaultWeather: ['clear', 'clouds'],
    defaultTimeOfDay: ['morning', 'day'],
    description: '川や湖でのんびり楽しむ水上活動'
  },
  {
    name: 'SUP（スタンドアップパドルボード）',
    category: 'アクティブ系アウトドア',
    categoryIcon: '🏔',
    isOutdoor: true,
    defaultWeather: ['clear', 'clouds'],
    defaultTimeOfDay: ['morning', 'day'],
    description: 'ボードの上に立ちパドルで進むスポーツ'
  },
  {
    name: 'サーフィン',
    category: 'アクティブ系アウトドア',
    categoryIcon: '🏔',
    isOutdoor: true,
    defaultWeather: ['clear', 'clouds'],
    defaultTimeOfDay: ['morning', 'day'],
    description: '波に乗るエキサイティングなマリンスポーツ'
  },
  {
    name: 'ラフティング',
    category: 'アクティブ系アウトドア',
    categoryIcon: '🏔',
    isOutdoor: true,
    defaultWeather: ['clear', 'clouds'],
    defaultTimeOfDay: ['day'],
    description: 'ゴムボートで急流を下るスリル満点の活動'
  },
  {
    name: 'ロッククライミング（屋外）',
    category: 'アクティブ系アウトドア',
    categoryIcon: '🏔',
    isOutdoor: true,
    defaultWeather: ['clear', 'clouds'],
    defaultTimeOfDay: ['morning', 'day'],
    description: '岩壁を登る技術的なスポーツ'
  },
  {
    name: 'ボルダリング（屋外）',
    category: 'アクティブ系アウトドア',
    categoryIcon: '🏔',
    isOutdoor: true,
    defaultWeather: ['clear', 'clouds'],
    defaultTimeOfDay: ['morning', 'day'],
    description: 'ロープを使わずに岩を登るクライミング'
  },
  {
    name: 'パラグライダー',
    category: 'アクティブ系アウトドア',
    categoryIcon: '🏔',
    isOutdoor: true,
    defaultWeather: ['clear'],
    defaultTimeOfDay: ['morning', 'day'],
    description: 'パラシュート型の翼で空中散歩を楽しむ'
  },
  {
    name: 'ハンググライダー',
    category: 'アクティブ系アウトドア',
    categoryIcon: '🏔',
    isOutdoor: true,
    defaultWeather: ['clear'],
    defaultTimeOfDay: ['morning', 'day'],
    description: '固定翼で長時間の滑空飛行を楽しむ'
  },
  {
    name: 'スカイダイビング',
    category: 'アクティブ系アウトドア',
    categoryIcon: '🏔',
    isOutdoor: true,
    defaultWeather: ['clear'],
    defaultTimeOfDay: ['morning', 'day'],
    description: '航空機から飛び降りるエクストリームスポーツ'
  },

  // 🏃‍♂️ スポーツ・運動系
  {
    name: 'サッカー',
    category: 'スポーツ・運動系',
    categoryIcon: '🏃‍♂️',
    isOutdoor: true,
    defaultWeather: ['clear', 'clouds'],
    defaultTimeOfDay: ['morning', 'day', 'evening'],
    description: '世界で最も人気のあるチームスポーツ'
  },
  {
    name: 'バスケットボール',
    category: 'スポーツ・運動系',
    categoryIcon: '🏃‍♂️',
    isOutdoor: true,
    defaultWeather: ['clear', 'clouds'],
    defaultTimeOfDay: ['morning', 'day', 'evening'],
    description: 'ゴールにボールを入れる技術系スポーツ'
  },
  {
    name: 'テニス',
    category: 'スポーツ・運動系',
    categoryIcon: '🏃‍♂️',
    isOutdoor: true,
    defaultWeather: ['clear', 'clouds'],
    defaultTimeOfDay: ['morning', 'day', 'evening'],
    description: 'ラケットでボールを打ち合う個人・ペア競技'
  },
  {
    name: 'ランニング',
    category: 'スポーツ・運動系',
    categoryIcon: '🏃‍♂️',
    isOutdoor: true,
    defaultWeather: ['clear', 'clouds', 'drizzle'],
    defaultTimeOfDay: ['morning', 'evening'],
    description: '健康維持に最適な有酸素運動'
  },
  {
    name: 'ジョギング',
    category: 'スポーツ・運動系',
    categoryIcon: '🏃‍♂️',
    isOutdoor: true,
    defaultWeather: ['clear', 'clouds', 'drizzle'],
    defaultTimeOfDay: ['morning', 'evening'],
    description: 'ゆっくりとしたペースでの軽い走行'
  },
  {
    name: 'ゴルフ',
    category: 'スポーツ・運動系',
    categoryIcon: '🏃‍♂️',
    isOutdoor: true,
    defaultWeather: ['clear', 'clouds'],
    defaultTimeOfDay: ['morning', 'day'],
    description: 'クラブでボールを打ちホールを目指すスポーツ'
  },
  {
    name: 'フィッシング（釣り）',
    category: 'スポーツ・運動系',
    categoryIcon: '🏃‍♂️',
    isOutdoor: true,
    defaultWeather: ['clear', 'clouds', 'drizzle'],
    defaultTimeOfDay: ['morning', 'day', 'evening'],
    description: '魚を釣る静かで集中力を要する活動'
  },
  {
    name: 'サイクリング',
    category: 'スポーツ・運動系',
    categoryIcon: '🏃‍♂️',
    isOutdoor: true,
    defaultWeather: ['clear', 'clouds'],
    defaultTimeOfDay: ['morning', 'day', 'evening'],
    description: '自転車で景色を楽しみながらの移動・運動'
  },
  {
    name: 'ロードバイク',
    category: 'スポーツ・運動系',
    categoryIcon: '🏃‍♂️',
    isOutdoor: true,
    defaultWeather: ['clear', 'clouds'],
    defaultTimeOfDay: ['morning', 'day'],
    description: '高性能自転車での本格的なサイクリング'
  },
  {
    name: 'ウォーキング',
    category: 'スポーツ・運動系',
    categoryIcon: '🏃‍♂️',
    isOutdoor: true,
    defaultWeather: ['clear', 'clouds', 'drizzle'],
    defaultTimeOfDay: ['morning', 'day', 'evening'],
    description: '誰でも始められる基本的な有酸素運動'
  },
  {
    name: 'ノルディックウォーキング',
    category: 'スポーツ・運動系',
    categoryIcon: '🏃‍♂️',
    isOutdoor: true,
    defaultWeather: ['clear', 'clouds'],
    defaultTimeOfDay: ['morning', 'day'],
    description: 'ポールを使った全身運動のウォーキング'
  },
  {
    name: 'スケートボード',
    category: 'スポーツ・運動系',
    categoryIcon: '🏃‍♂️',
    isOutdoor: true,
    defaultWeather: ['clear', 'clouds'],
    defaultTimeOfDay: ['day', 'evening'],
    description: 'ボードで技を決めるストリートスポーツ'
  },
  {
    name: 'インラインスケート',
    category: 'スポーツ・運動系',
    categoryIcon: '🏃‍♂️',
    isOutdoor: true,
    defaultWeather: ['clear', 'clouds'],
    defaultTimeOfDay: ['morning', 'day', 'evening'],
    description: '車輪付きシューズでの滑走スポーツ'
  },
  {
    name: 'フリスビー',
    category: 'スポーツ・運動系',
    categoryIcon: '🏃‍♂️',
    isOutdoor: true,
    defaultWeather: ['clear', 'clouds'],
    defaultTimeOfDay: ['day', 'evening'],
    description: '円盤を投げ合う気軽なレクリエーション'
  },
  {
    name: 'アルティメット（フリスビー競技）',
    category: 'スポーツ・運動系',
    categoryIcon: '🏃‍♂️',
    isOutdoor: true,
    defaultWeather: ['clear', 'clouds'],
    defaultTimeOfDay: ['day', 'evening'],
    description: 'フリスビーを使った本格的なチームスポーツ'
  }
];

// カテゴリ別にグループ化
export const HOBBY_CATEGORIES = [
  {
    name: '自然系アウトドア',
    icon: '🌿',
    hobbies: HOBBY_SUGGESTIONS.filter(h => h.category === '自然系アウトドア')
  },
  {
    name: 'アクティブ系アウトドア',
    icon: '🏔',
    hobbies: HOBBY_SUGGESTIONS.filter(h => h.category === 'アクティブ系アウトドア')
  },
  {
    name: 'スポーツ・運動系',
    icon: '🏃‍♂️',
    hobbies: HOBBY_SUGGESTIONS.filter(h => h.category === 'スポーツ・運動系')
  }
];

// 活動時間帯の設定
export const TIME_OF_DAY_OPTIONS = [
  { key: 'morning', label: '朝', icon: '🌅', description: '6:00-11:59' },
  { key: 'day', label: '昼', icon: '☀️', description: '12:00-17:59' },
  { key: 'evening', label: '夕', icon: '🌆', description: '18:00-20:59' },
  { key: 'night', label: '夜', icon: '🌙', description: '21:00-5:59' }
] as const;