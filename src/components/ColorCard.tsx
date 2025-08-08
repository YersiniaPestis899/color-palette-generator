'use client';

import React, { useState, useCallback } from 'react';
import { Copy, Check, Palette, Trash2, Edit3 } from 'lucide-react';
import { ColorCardProps } from '../types/color';
import { copyToClipboard, isLightColor, getContrastRatio } from '../utils/colorUtils';

export default function ColorCard({ 
  color, 
  onColorChange, 
  onRemove, 
  showControls = false 
}: ColorCardProps) {
  const [copied, setCopied] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(color.hex);

  const handleCopy = useCallback(async (text: string, type: string) => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    }
  }, []);

  const handleEdit = useCallback(() => {
    setIsEditing(true);
    setEditValue(color.hex);
  }, [color.hex]);

  const handleSaveEdit = useCallback(() => {
    try {
      // 簡単な HEX 値検証
      if (!/^#[0-9A-F]{6}$/i.test(editValue)) {
        alert('正しいHEX値を入力してください（例：#FF5733）');
        return;
      }
      
      // 新しい色情報を作成
      const newColor = {
        ...color,
        hex: editValue.toUpperCase(),
        rgb: {
          r: parseInt(editValue.slice(1, 3), 16),
          g: parseInt(editValue.slice(3, 5), 16),
          b: parseInt(editValue.slice(5, 7), 16),
        }
      };
      
      // HSL値も更新
      const hsl = hexToHsl(editValue);
      newColor.hsl = hsl;
      
      onColorChange?.(newColor);
      setIsEditing(false);
    } catch (error) {
      alert('色の変更に失敗しました');
    }
  }, [editValue, color, onColorChange]);

  const handleCancelEdit = useCallback(() => {
    setIsEditing(false);
    setEditValue(color.hex);
  }, [color.hex]);

  // HEX から HSL への変換（簡易版）
  const hexToHsl = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }

    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100)
    };
  };

  const textColor = isLightColor(color.hex) ? '#000000' : '#FFFFFF';
  const contrastRatio = getContrastRatio(color.hex, textColor);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
      {/* カラーバー */}
      <div 
        className="h-32 relative group cursor-pointer"
        style={{ backgroundColor: color.hex }}
        onClick={() => handleCopy(color.hex, 'hex')}
      >
        {/* ホバー時の情報 */}
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div className="absolute inset-0 flex items-center justify-center">
            <div 
              className="bg-white/90 dark:bg-gray-800/90 rounded-lg p-2 text-center"
              style={{ color: textColor }}
            >
              <p className="text-sm font-medium">{color.hex}</p>
              <p className="text-xs">クリックでコピー</p>
            </div>
          </div>
        </div>
        
        {/* コントロールボタン */}
        {showControls && (
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <div className="flex space-x-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleEdit();
                }}
                className="p-1 bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors duration-200 cursor-pointer"
                title="色を編集"
              >
                <Edit3 className="h-3 w-3" />
              </button>
              
              {onRemove && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove();
                  }}
                  className="p-1 bg-red-500 hover:bg-red-600 text-white rounded transition-colors duration-200 cursor-pointer"
                  title="色を削除"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* 色情報 */}
      <div className="p-4 space-y-3">
        {/* 色名 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Palette className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {color.name}
            </span>
          </div>
          
          {/* アクセシビリティ情報 */}
          <div className="flex items-center space-x-1">
            <div 
              className={`w-2 h-2 rounded-full ${
                contrastRatio >= 4.5 ? 'bg-green-500' : 
                contrastRatio >= 3 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              title={`コントラスト比: ${contrastRatio.toFixed(2)}`}
            />
            <span className="text-xs text-gray-500">
              {contrastRatio >= 4.5 ? 'AA' : contrastRatio >= 3 ? 'A' : 'NG'}
            </span>
          </div>
        </div>
        
        {/* HEX値 */}
        <div className="space-y-2">
          {isEditing ? (
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="flex-1 px-2 py-1 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="#FF5733"
              />
              <button
                onClick={handleSaveEdit}
                className="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 transition-colors cursor-pointer"
              >
                保存
              </button>
              <button
                onClick={handleCancelEdit}
                className="px-2 py-1 bg-gray-500 text-white rounded text-xs hover:bg-gray-600 transition-colors cursor-pointer"
              >
                キャンセル
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <span className="text-sm font-mono text-gray-600 dark:text-gray-400">
                {color.hex}
              </span>
              <button
                onClick={() => handleCopy(color.hex, 'hex')}
                className="p-1 text-gray-400 hover:text-blue-500 transition-colors duration-200 cursor-pointer"
                title="HEX値をコピー"
              >
                {copied === 'hex' ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </button>
            </div>
          )}
        </div>
        
        {/* RGB値 */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-mono text-gray-600 dark:text-gray-400">
            rgb({color.rgb.r}, {color.rgb.g}, {color.rgb.b})
          </span>
          <button
            onClick={() => handleCopy(`rgb(${color.rgb.r}, ${color.rgb.g}, ${color.rgb.b})`, 'rgb')}
            className="p-1 text-gray-400 hover:text-blue-500 transition-colors duration-200 cursor-pointer"
            title="RGB値をコピー"
          >
            {copied === 'rgb' ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </button>
        </div>
        
        {/* HSL値 */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-mono text-gray-600 dark:text-gray-400">
            hsl({color.hsl.h}, {color.hsl.s}%, {color.hsl.l}%)
          </span>
          <button
            onClick={() => handleCopy(`hsl(${color.hsl.h}, ${color.hsl.s}%, ${color.hsl.l}%)`, 'hsl')}
            className="p-1 text-gray-400 hover:text-blue-500 transition-colors duration-200 cursor-pointer"
            title="HSL値をコピー"
          >
            {copied === 'hsl' ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
