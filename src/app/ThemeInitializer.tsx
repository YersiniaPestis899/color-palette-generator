'use client';

import { useEffect } from 'react';
import { initializeTheme } from '../utils/themeUtils';

export default function ThemeInitializer() {
  useEffect(() => {
    // アプリケーション起動時にテーマを初期化
    initializeTheme();
  }, []);

  // このコンポーネントは何もレンダリングしない
  return null;
}
