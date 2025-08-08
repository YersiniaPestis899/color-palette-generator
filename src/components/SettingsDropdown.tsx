"use client";

import React, { useRef, useEffect, useState } from "react";
import { Info, HelpCircle, Sun, Moon } from "lucide-react";
import { THEME_CONFIG, ThemeMode, toggleTheme, getCurrentTheme } from '../utils/themeUtils';

interface SettingsDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  colorCount: number;
  onColorCountChange: (count: number) => void;
  onShowHowToUse: () => void;
}

export default function SettingsDropdown({
  isOpen,
  onClose,
  colorCount,
  onColorCountChange,
  onShowHowToUse,
}: SettingsDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [currentTheme, setCurrentTheme] = useState<ThemeMode>('light');

  // テーマの初期状態を設定
  useEffect(() => {
    setCurrentTheme(getCurrentTheme());
  }, []);

  // テーマ切り替え処理
  const handleThemeToggle = () => {
    const newTheme = toggleTheme();
    setCurrentTheme(newTheme);
  };

  // 外側クリックで閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={dropdownRef}
      className="absolute top-full right-0 mt-2 w-80 theme-dropdown rounded-xl shadow-2xl border theme-border overflow-hidden z-50"
    >
      {/* テーマ切り替え */}
      <div className="px-4 py-4">
        <label className="block text-sm font-medium theme-text-primary mb-3">
          テーマ設定
        </label>
        <button
          onClick={handleThemeToggle}
          className="w-full flex items-center justify-between px-3 py-2 text-sm border theme-input rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors cursor-pointer"
        >
          <div className="flex items-center space-x-2">
            <span className="text-lg">
              {currentTheme === 'light' ? THEME_CONFIG.light.icon : THEME_CONFIG.dark.icon}
            </span>
            <span>
              {currentTheme === 'light' ? THEME_CONFIG.light.name : THEME_CONFIG.dark.name}モード
            </span>
          </div>
          <div className="flex items-center space-x-1 text-xs theme-text-secondary">
            {currentTheme === 'light' ? <Sun className="h-3 w-3" /> : <Moon className="h-3 w-3" />}
            <span>切り替え</span>
          </div>
        </button>
        <div className="flex items-start space-x-2 mt-2 text-xs theme-text-muted">
          <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
          <span>
            {currentTheme === 'light' ? THEME_CONFIG.light.description : THEME_CONFIG.dark.description}で表示しています
          </span>
        </div>
      </div>

      {/* セクション区切り線 */}
      <div className="border-t theme-border"></div>
      {/* 抽出色数設定 */}
      <div className="px-4 py-4">
        <label className="block text-sm font-medium theme-text-primary mb-3">
          最初に抽出する色の数
        </label>
        <select
          value={colorCount}
          onChange={(e) => onColorCountChange(parseInt(e.target.value))}
          className="w-full px-3 py-2 text-sm border theme-input rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {[3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
            <option key={num} value={num}>
              {num}色
            </option>
          ))}
        </select>
        <div className="flex items-start space-x-2 mt-2 text-xs theme-text-muted">
          <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
          <span>
            多い色数ほど詳細な分析が可能ですが、処理時間が長くなります
          </span>
        </div>
      </div>

      {/* セクション区切り線 */}
      <div className="border-t theme-border"></div>

      {/* 使い方ボタン */}
      <div className="px-4 py-4">
        <button
          onClick={onShowHowToUse}
          className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors text-sm font-medium cursor-pointer"
        >
          <HelpCircle className="h-4 w-4" />
          <span>このアプリの使い方</span>
        </button>
      </div>
    </div>
  );
}
