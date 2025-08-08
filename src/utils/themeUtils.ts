// テーマ設定の定数（保守性のため一箇所にまとめて管理）
export const THEME_CONFIG = {
  light: {
    name: 'ライト',
    icon: '☀️',
    backgroundColor: '#F7F7F7',
    textColor: '#333333', 
    description: '明るいテーマ'
  },
  dark: {
    name: 'ダーク', 
    icon: '🌙',
    backgroundColor: '#1f2937', // 現在のダークモード色味を維持
    textColor: '#f3f4f6',
    description: '暗いテーマ'
  }
} as const;

export type ThemeMode = keyof typeof THEME_CONFIG;

// テーマ切り替えのユーティリティ関数
export const toggleTheme = (): ThemeMode => {
  const isDark = document.documentElement.classList.contains('dark');
  
  if (isDark) {
    // ダークモードからライトモードへ
    document.documentElement.classList.remove('dark');
    document.documentElement.style.backgroundColor = THEME_CONFIG.light.backgroundColor;
    document.documentElement.style.color = THEME_CONFIG.light.textColor;
    localStorage.setItem('theme', 'light');
    return 'light';
  } else {
    // ライトモードからダークモードへ
    document.documentElement.classList.add('dark');
    document.documentElement.style.backgroundColor = THEME_CONFIG.dark.backgroundColor;
    document.documentElement.style.color = THEME_CONFIG.dark.textColor;
    localStorage.setItem('theme', 'dark');
    return 'dark';
  }
};

// 現在のテーマを取得
export const getCurrentTheme = (): ThemeMode => {
  if (typeof window === 'undefined') return 'light';
  
  const isDark = document.documentElement.classList.contains('dark');
  return isDark ? 'dark' : 'light';
};

// 初期テーマを設定（ページ読み込み時）
export const initializeTheme = (): ThemeMode => {
  if (typeof window === 'undefined') return 'light';
  
  const savedTheme = localStorage.getItem('theme') as ThemeMode | null;
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  const theme = savedTheme || (prefersDark ? 'dark' : 'light');
  
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
    document.documentElement.style.backgroundColor = THEME_CONFIG.dark.backgroundColor;
    document.documentElement.style.color = THEME_CONFIG.dark.textColor;
  } else {
    document.documentElement.classList.remove('dark');
    document.documentElement.style.backgroundColor = THEME_CONFIG.light.backgroundColor;
    document.documentElement.style.color = THEME_CONFIG.light.textColor;
  }
  
  return theme;
};
