'use client';

import React, { useState, useCallback } from 'react';
import { Download, Share2, Save, Palette, Grid, List, Settings } from 'lucide-react';
import { PaletteDisplayProps } from '../types/color';
import { exportToCss, exportToJson, copyToClipboard } from '../utils/colorUtils';
import ColorCard from './ColorCard';

export default function PaletteDisplay({ palette, onSave, onShare }: PaletteDisplayProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [exportFormat, setExportFormat] = useState<'css' | 'json' | 'text'>('css');

  const handleExport = useCallback(async (format: string) => {
    let exportData = '';
    let filename = `${palette.name || 'palette'}.${format}`;
    
    switch (format) {
      case 'css':
        exportData = exportToCss(palette.colors, palette.name);
        break;
      case 'json':
        exportData = exportToJson(palette.colors, palette.name);
        break;
      case 'text':
        exportData = palette.colors.map(color => color.hex).join('\n');
        filename = `${palette.name || 'palette'}.txt`;
        break;
      default:
        return;
    }
    
    // ダウンロード
    const blob = new Blob([exportData], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    setShowExportMenu(false);
  }, [palette]);

  const handleCopyAllColors = useCallback(async () => {
    const colorText = palette.colors.map(color => color.hex).join(', ');
    await copyToClipboard(colorText);
  }, [palette.colors]);

  const handleSharePalette = useCallback(() => {
    if (navigator.share) {
      navigator.share({
        title: `カラーパレット: ${palette.name}`,
        text: `素敵なカラーパレットを見つけました！\n\n${palette.colors.map(c => c.hex).join(', ')}`,
        url: window.location.href
      });
    } else {
      // フォールバック: URLをクリップボードにコピー
      copyToClipboard(window.location.href);
    }
    
    onShare?.();
  }, [palette, onShare]);

  return (
    <div className="w-full space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Palette className="h-6 w-6 text-blue-500" />
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
            {palette.name || 'Generated Palette'}
          </h2>
          <span className="bg-blue-100 text-blue-800 text-sm px-2 py-1 rounded-full">
            {palette.colors.length} 色
          </span>
        </div>
        
        {/* アクションボタン */}
        <div className="flex items-center space-x-2">
          {/* 表示モード切り替え */}
          <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded cursor-pointer ${
                viewMode === 'grid' 
                  ? 'bg-white dark:bg-gray-600 shadow-sm' 
                  : 'hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
              title="グリッド表示"
            >
              <Grid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded cursor-pointer ${
                viewMode === 'list' 
                  ? 'bg-white dark:bg-gray-600 shadow-sm' 
                  : 'hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
              title="リスト表示"
            >
              <List className="h-4 w-4" />
            </button>
          </div>
          
          {/* エクスポートメニュー */}
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="flex items-center space-x-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors duration-200 cursor-pointer"
            >
              <Download className="h-4 w-4" />
              <span>エクスポート</span>
            </button>
            
            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10">
                <div className="p-2 space-y-1">
                  <button
                    onClick={() => handleExport('css')}
                    className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-sm cursor-pointer"
                  >
                    CSS Variables
                  </button>
                  <button
                    onClick={() => handleExport('json')}
                    className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-sm cursor-pointer"
                  >
                    JSON
                  </button>
                  <button
                    onClick={() => handleExport('text')}
                    className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-sm cursor-pointer"
                  >
                    テキスト
                  </button>
                  <hr className="my-1" />
                  <button
                    onClick={handleCopyAllColors}
                    className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-sm cursor-pointer"
                  >
                    すべての色をコピー
                  </button>
                </div>
              </div>
            )}
          </div>
          
          {/* 共有ボタン */}
          <button
            onClick={handleSharePalette}
            className="flex items-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors duration-200 cursor-pointer"
          >
            <Share2 className="h-4 w-4" />
            <span>共有</span>
          </button>
          
          {/* 保存ボタン */}
          {onSave && (
            <button
              onClick={onSave}
              className="flex items-center space-x-2 bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg transition-colors duration-200 cursor-pointer"
            >
              <Save className="h-4 w-4" />
              <span>保存</span>
            </button>
          )}
        </div>
      </div>
      
      {/* パレット概要 */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            🎨 クイックプレビュー
          </h3>
          <span className="text-xs text-gray-500">
            {new Date(palette.createdAt).toLocaleString('ja-JP')}
          </span>
        </div>
        
        {/* 色のストライプ */}
        <div className="flex h-8 rounded-lg overflow-hidden shadow-sm">
          {palette.colors.map((color, index) => (
            <div
              key={index}
              className="flex-1 cursor-pointer hover:opacity-80 transition-opacity"
              style={{ backgroundColor: color.hex }}
              title={`${color.name} (${color.hex})`}
              onClick={() => copyToClipboard(color.hex)}
            />
          ))}
        </div>
        
        {/* 統計情報 */}
        <div className="mt-3 flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
          <span>平均明度: {Math.round(palette.colors.reduce((acc, color) => acc + color.hsl.l, 0) / palette.colors.length)}%</span>
          <span>平均彩度: {Math.round(palette.colors.reduce((acc, color) => acc + color.hsl.s, 0) / palette.colors.length)}%</span>
        </div>
      </div>
      
      {/* 外部でクリックしたときにメニューを閉じる */}
      {showExportMenu && (
        <div
          className="fixed inset-0 z-5"
          onClick={() => setShowExportMenu(false)}
        />
      )}
      
      {/* カラーカード */}
      <div className={`
        ${viewMode === 'grid' 
          ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4' 
          : 'space-y-4'
        }
      `}>
        {palette.colors.map((color, index) => (
          <ColorCard
            key={`${color.hex}-${index}`}
            color={color}
            showControls={false}
          />
        ))}
      </div>
      
      {/* 使用例 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
        <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">
          💡 使用例
        </h3>
        
        <div className="space-y-4">
          {/* CSS例 */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              CSS Variables
            </h4>
            <pre className="bg-gray-100 dark:bg-gray-700 rounded p-3 text-sm overflow-x-auto">
              <code>
{`:root {
${palette.colors.map((color, index) => `  --color-${index + 1}: ${color.hex};`).join('\n')}
}`}
              </code>
            </pre>
          </div>
          
          {/* デザイン例 */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              デザインプレビュー
            </h4>
            <div className="grid grid-cols-2 gap-4">
              {/* グラデーション例 */}
              <div
                className="h-20 rounded-lg"
                style={{
                  background: `linear-gradient(135deg, ${palette.colors.map(c => c.hex).join(', ')})`
                }}
              />
              
              {/* カード例 */}
              <div className="h-20 rounded-lg flex items-center justify-center" style={{ backgroundColor: palette.colors[0]?.hex }}>
                <div className="text-center" style={{ color: palette.colors[1]?.hex }}>
                  <div className="text-sm font-medium">サンプルカード</div>
                  <div className="text-xs">カラーパレット</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
