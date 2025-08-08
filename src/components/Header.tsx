"use client";

import React from "react";
import { Palette, Settings, Sparkles, Briefcase } from "lucide-react";
import { PaletteTheme } from "../types/color";
import SettingsDropdown from "./SettingsDropdown";

interface HeaderProps {
  paletteTheme: PaletteTheme;
  onThemeChange: (theme: PaletteTheme) => void;
  showSettings: boolean;
  onToggleSettings: () => void;
  currentPalette: any;
  colorCount: number;
  onColorCountChange: (count: number) => void;
  onShowHowToUse: () => void;
}

export default function Header({
  paletteTheme,
  onThemeChange,
  showSettings,
  onToggleSettings,
  currentPalette,
  colorCount,
  onColorCountChange,
  onShowHowToUse,
}: HeaderProps) {
  // テーマ情報
  const themeInfo = {
    elementary: {
      name: "子供向け",
      description: "おおきくて楽しいパレット",
      color: "from-pink-400 to-purple-400",
      icon: Sparkles,
    },
    middle: {
      name: "大人向け",
      description: "プロ向け高機能パレット",
      color: "from-blue-400 to-green-400",
      icon: Briefcase,
    },
  };

  return (
    <header className="theme-header border-b border-gray-100 border-opacity-30 dark:border-gray-700 sticky top-0 z-50">
      <div className="flex items-center justify-between h-16 lg:h-20 xl:h-24 px-8 sm:px-10 lg:px-16 xl:px-20">
        <div className="flex items-center space-x-3 lg:space-x-6">
          <div
            className={`p-2 lg:p-3 xl:p-4 bg-gradient-to-r ${themeInfo[paletteTheme].color} rounded-lg lg:rounded-xl`}
          >
            <Palette className="h-6 w-6 lg:h-8 lg:w-8 xl:h-10 xl:w-10 text-white" />
          </div>
          <div>
            <h1 className="text-xl lg:text-2xl xl:text-3xl font-bold theme-text-primary">
              Color Palette Generator
            </h1>
          </div>
        </div>

        <div className="flex items-center space-x-4 lg:space-x-6">
          {/* パレットスタイル切り替え */}
          <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            {(Object.keys(themeInfo) as PaletteTheme[]).map((theme) => {
              const info = themeInfo[theme];
              const Icon = info.icon;
              return (
                <button
                  key={theme}
                  onClick={() => onThemeChange(theme)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md font-medium transition-all duration-200 text-sm cursor-pointer ${
                    paletteTheme === theme
                      ? `bg-gradient-to-r ${info.color} text-white shadow-md`
                      : "theme-text-secondary hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
                  title={info.description}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{info.name}</span>
                </button>
              );
            })}
          </div>

          {/* 設定ボタンとドロップダウン */}
          <div className="relative">
            <button
              onClick={onToggleSettings}
              className="p-3 lg:p-4 theme-text-secondary hover:theme-text-primary transition-colors cursor-pointer"
              title="設定"
            >
              <Settings className="h-6 w-6 lg:h-8 lg:w-8 xl:h-10 xl:w-10" />
            </button>

            <SettingsDropdown
              isOpen={showSettings}
              onClose={onToggleSettings}
              colorCount={colorCount}
              onColorCountChange={onColorCountChange}
              onShowHowToUse={onShowHowToUse}
            />
          </div>
        </div>
      </div>
    </header>
  );
}
