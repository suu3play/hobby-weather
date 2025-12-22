// OpenWeatherMap API Key設定確認用テスト

/**
 * 環境変数の確認
 */
export function checkEnvironmentVariables() {
  console.log('=== 環境変数確認 ===');
  console.log('import.meta.env:', import.meta.env);
  console.log('VITE_OPENWEATHER_API_KEY:', import.meta.env['VITE_OPENWEATHER_API_KEY']);
  console.log('typeof VITE_OPENWEATHER_API_KEY:', typeof import.meta.env['VITE_OPENWEATHER_API_KEY']);
  console.log('length:', import.meta.env['VITE_OPENWEATHER_API_KEY']?.length);
  
  // プロセス環境変数も確認（ブラウザでは通常undefined）
  if (typeof process !== 'undefined' && process.env) {
    console.log('process.env.VITE_OPENWEATHER_API_KEY:', process.env['VITE_OPENWEATHER_API_KEY']);
  }
  
  return {
    hasApiKey: !!import.meta.env['VITE_OPENWEATHER_API_KEY'],
    apiKeyLength: import.meta.env['VITE_OPENWEATHER_API_KEY']?.length ?? 0,
    apiKeyPreview: import.meta.env['VITE_OPENWEATHER_API_KEY'] ? 
      `${import.meta.env['VITE_OPENWEATHER_API_KEY'].substring(0, 8)}...` : 
      'undefined'
  };
}

/**
 * WeatherServiceのAPI Key確認
 */
export async function checkWeatherServiceApiKey() {
  console.log('=== WeatherService API Key確認 ===');
  
  try {
    // WeatherServiceをインポートして確認
    const { weatherService } = await import('./weather.service');
    
    // プライベートプロパティにアクセスできるように型キャスト
    const service = weatherService as unknown as { apiKey?: string };
    
    console.log('WeatherService apiKey:', service.apiKey);
    console.log('WeatherService apiKey type:', typeof service.apiKey);
    console.log('WeatherService apiKey length:', service.apiKey?.length);
    console.log('WeatherService apiKey preview:', service.apiKey ? 
      `${service.apiKey.substring(0, 8)}...` : 
      'undefined or empty');
    
    return {
      hasApiKey: !!service.apiKey,
      apiKeyLength: service.apiKey?.length ?? 0,
      apiKeyPreview: service.apiKey ? 
        `${service.apiKey.substring(0, 8)}...` : 
        'undefined or empty'
    };
  } catch (error) {
    console.error('WeatherService確認エラー:', error);
    return {
      hasApiKey: false,
      apiKeyLength: 0,
      apiKeyPreview: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * API接続テスト
 */
export async function testApiConnection() {
  console.log('=== API接続テスト ===');
  
  const apiKey = import.meta.env['VITE_OPENWEATHER_API_KEY'];
  
  if (!apiKey) {
    console.error('API Keyが設定されていません');
    return {
      success: false,
      error: 'API Key not found'
    };
  }
  
  try {
    // 東京の現在の天気を取得してテスト
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=35.6762&lon=139.6503&appid=${apiKey}&units=metric&lang=ja`;
    
    console.log('リクエストURL (API Key部分は非表示):', 
      url.replace(apiKey, '***API_KEY***'));
    
    const response = await fetch(url);
    
    // Check if response is valid
    if (!response) {
      throw new Error('Response is undefined - fetch may not be available');
    }
    
    console.log('レスポンスステータス:', response.status);
    console.log('レスポンスOK:', response.ok);
    
    if (response.ok) {
      const data = await response.json();
      console.log('API接続成功:', {
        city: data.name,
        weather: data.weather[0]?.description,
        temp: data.main.temp
      });
      
      return {
        success: true,
        data: {
          city: data.name,
          weather: data.weather[0]?.description,
          temperature: data.main.temp
        }
      };
    } else {
      const errorData = await response.json();
      console.error('API接続失敗:', errorData);
      
      return {
        success: false,
        status: response.status,
        error: errorData.message ?? 'API request failed'
      };
    }
  } catch (error) {
    console.error('API接続エラー:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error'
    };
  }
}

/**
 * 全体的な診断
 */
export async function runDiagnostics() {
  console.log('🔍 OpenWeatherMap API Key診断開始');
  console.log('=====================================');
  
  const envCheck = checkEnvironmentVariables();
  const serviceCheck = await checkWeatherServiceApiKey();
  const connectionCheck = await testApiConnection();
  
  console.log('=====================================');
  console.log('📊 診断結果サマリー');
  console.log('=====================================');
  
  const results = {
    environment: envCheck,
    weatherService: serviceCheck,
    apiConnection: connectionCheck,
    recommendations: [] as string[]
  };
  
  // 推奨事項の生成
  if (!envCheck.hasApiKey) {
    results.recommendations.push('❌ 環境変数 VITE_OPENWEATHER_API_KEY が設定されていません');
    results.recommendations.push('💡 .env.local ファイルにAPIキーを設定してください');
  } else if (envCheck.apiKeyLength < 32) {
    results.recommendations.push('⚠️ APIキーの長さが短すぎる可能性があります');
  } else {
    results.recommendations.push('✅ 環境変数は正しく設定されています');
  }
  
  if (!serviceCheck.hasApiKey) {
    results.recommendations.push('❌ WeatherServiceでAPIキーが読み込まれていません');
    results.recommendations.push('💡 開発サーバーを再起動してください');
  } else {
    results.recommendations.push('✅ WeatherServiceでAPIキーが確認できました');
  }
  
  if (!connectionCheck.success) {
    results.recommendations.push('❌ API接続に失敗しました');
    if (connectionCheck.status === 401) {
      results.recommendations.push('💡 APIキーが無効です。OpenWeatherMapで確認してください');
    } else if (connectionCheck.status === 429) {
      results.recommendations.push('💡 API使用制限に達しています。しばらく待ってから再試行してください');
    } else {
      results.recommendations.push('💡 ネットワーク接続またはAPIキーを確認してください');
    }
  } else {
    results.recommendations.push('✅ API接続が正常に動作しています');
  }
  
  console.log('推奨事項:');
  results.recommendations.forEach((rec) => console.log(rec));
  
  return results;
}

// 開発環境でのみ自動実行
if (import.meta.env.DEV) {
  // 少し遅延させてから実行（モジュールの初期化を待つ）
  setTimeout(() => {
    runDiagnostics();
  }, 1000);
}