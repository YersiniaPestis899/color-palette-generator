'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Download, Share2, Save, Palette, Sparkles, Copy, Heart, Trash2, X, Droplets, Eye, EyeOff } from 'lucide-react';
import { PaletteDisplayProps, MixedColor, ColorInfo } from '../types/color';
import { exportToCss, exportToJson, copyToClipboard, generateColorId } from '../utils/colorUtils';
import { handleImageEyedropper, getCanvasCoordinatesFromImageClick } from '../utils/imageUtils';
import ElementaryColorMixer from './ElementaryColorMixer';

export default function ElementaryPaletteDisplay({ palette, onSave, onShare, onReset, theme }: PaletteDisplayProps) {
  const [mixedColors, setMixedColors] = useState<MixedColor[]>([]);
  const [sparkleColor, setSparkleColor] = useState<string | null>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [duplicateNotification, setDuplicateNotification] = useState<string | null>(null);
  const [extractedColors, setExtractedColors] = useState<ColorInfo[]>([]);
  const [isEyedropperMode, setIsEyedropperMode] = useState(false);
  const [previewColor, setPreviewColor] = useState<{ hex: string; x: number; y: number } | null>(null);
  const [magnifiedPreview, setMagnifiedPreview] = useState<{ imageData: string; x: number; y: number } | null>(null);
  const [showImage, setShowImage] = useState(true); // 画像表示状態を管理
  const imageRef = useRef<HTMLImageElement>(null);
  const previewTimeoutRef = useRef<NodeJS.Timeout | null>(null);


  // 色がクリックされたときのキラキラエフェクト＆コピー
  const handleColorClick = useCallback(async (colorHex: string) => {
    setSparkleColor(colorHex);
    await copyToClipboard(colorHex);
    
    setTimeout(() => setSparkleColor(null), 800);
  }, []);

  // 色混ぜの結果を処理（重複チェック付き）
  const handleColorMixed = useCallback((mixedColor: MixedColor) => {
    // 混ぜた色での重複チェック
    const isDuplicate = mixedColors.some(existingColor => existingColor.hex === mixedColor.hex);
    
    if (isDuplicate) {
      // 重複している場合は通知を表示して追加しない
      setDuplicateNotification(`同じ色（${mixedColor.hex}）がすでにあるよ！`);
      setTimeout(() => setDuplicateNotification(null), 2000);
      return;
    }
    
    // 🎨 混ぜた色をmixedColorsにのみ追加（上限30個）
    setMixedColors(prev => [mixedColor, ...prev].slice(0, 30));
  }, [mixedColors]);

  // 混ぜた色を削除（mixedColorsのみ）
  const handleRemoveMixedColor = useCallback((colorToRemove: MixedColor, index: number) => {
    // mixedColorsからのみ削除
    setMixedColors(prev => prev.filter((_, i) => i !== index));
  }, []);

  // 全ての混ぜた色をクリア（mixedColorsのみ）
  const handleClearAllMixedColors = useCallback(() => {
    // mixedColorsのみクリア
    setMixedColors([]);
  }, []);

  // 🎨 スポイト機能：画像から色を抽出
  const handleImageClick = useCallback(async (event: React.MouseEvent<HTMLImageElement>) => {
    if (!isEyedropperMode || !imageRef.current) return;
    
    try {
      const extractedColor = await handleImageEyedropper(event, imageRef.current);
      
      // 重複チェック
      const allColors = [...palette.colors, ...extractedColors, ...mixedColors];
      const isDuplicate = allColors.some(color => color.hex === extractedColor.hex);
      
      if (isDuplicate) {
        setDuplicateNotification(`おなじ色（${extractedColor.hex}）があるよ！`);
        setTimeout(() => setDuplicateNotification(null), 2000);
        return;
      }
      
      // 抽出した色を追加
      setExtractedColors(prev => [extractedColor, ...prev].slice(0, 8)); // 最大8個まで
      
      // キラキラエフェクト
      setSparkleColor(extractedColor.hex);
      setTimeout(() => setSparkleColor(null), 800);
      
      // プレビューを非表示
      setPreviewColor(null);
      setMagnifiedPreview(null);
      
    } catch (error) {
      console.error('色の抽出に失敗しました:', error);
    }
  }, [isEyedropperMode, palette.colors, extractedColors, mixedColors]);

  // 🔍 **💎 極限精度版**拡大プレビューを生成（サブピクセル精度対応）
  const generateMagnifiedPreview = useCallback(async (event: React.MouseEvent<HTMLImageElement>) => {
    if (!imageRef.current) return null;
    
    const img = imageRef.current;
    
    // 🎯 **重要**: 色抽出と全く同じ座標変換ロジックを使用
    const { x: canvasX, y: canvasY } = getCanvasCoordinatesFromImageClick(event, img);
    
    // 💎 極限精度拡大設定（より細かいサンプリング）
    const cropSize = 24; // 24x24ピクセルの範囲を拡大（より細かく）
    const displaySize = 96; // 96x96ピクセルで表示（高精細）
    const magnification = displaySize / cropSize; // 拡大率 = 4倍
    
    // キャンバスを作成
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { 
      willReadFrequently: true,
      alpha: false,
      desynchronized: true // パフォーマンス最適化
    });
    if (!ctx) return null;
    
    canvas.width = displaySize;
    canvas.height = displaySize;
    
    // 🎆 最高品質描画設定
    ctx.imageSmoothingEnabled = false; // ピクセルパーフェクト描画
    ctx.globalCompositeOperation = 'source-over'; // 最高品質モード
    
    // 🎯 キャンバス全体に元画像を描画してから切り取る方式
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d', { alpha: false });
    if (!tempCtx) return null;
    
    tempCanvas.width = img.naturalWidth;
    tempCanvas.height = img.naturalHeight;
    tempCtx.imageSmoothingEnabled = false;
    tempCtx.drawImage(img, 0, 0);
    
    // 💎 極限精度切り取り範囲を計算（サブピクセル精度）
    const halfCrop = cropSize / 2;
    const sourceX = Math.min(Math.max(0, canvasX - halfCrop), img.naturalWidth - cropSize);
    const sourceY = Math.min(Math.max(0, canvasY - halfCrop), img.naturalHeight - cropSize);
    const actualCropWidth = Math.min(cropSize, img.naturalWidth - sourceX);
    const actualCropHeight = Math.min(cropSize, img.naturalHeight - sourceY);
    
    try {
      // 💎 極限精度拡大描画（エッジ保存最適化）
      ctx.drawImage(
        tempCanvas,
        sourceX, sourceY, actualCropWidth, actualCropHeight,
        0, 0, displaySize, displaySize
      );
      
      // 🎯 中央に超高精度スポイト位置を示すクロスヘア
      const center = displaySize / 2;
      const crossSize = 8; // やや大きめで見やすく
      
      // シャドウ効果で視認性向上
      ctx.shadowColor = 'rgba(0,0,0,0.8)';
      ctx.shadowBlur = 2;
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;
      
      ctx.strokeStyle = '#FFDF00'; // より明るい金色
      ctx.lineWidth = 2; // 線を太く
      
      // 縦線
      ctx.beginPath();
      ctx.moveTo(center, center - crossSize);
      ctx.lineTo(center, center + crossSize);
      ctx.stroke();
      
      // 横線
      ctx.beginPath();
      ctx.moveTo(center - crossSize, center);
      ctx.lineTo(center + crossSize, center);
      ctx.stroke();
      
      return canvas.toDataURL('image/png', 1.0); // 最高品質で出力
    } catch (error) {
      console.error('極限精度拡大プレビューの生成に失敗:', error);
      return null;
    }
  }, []);

  // 🔍 **💎 超高精度版**リアルタイムプレビュー機能（サブピクセル精度対応）
  const handleImageMouseMove = useCallback(async (event: React.MouseEvent<HTMLImageElement>) => {
    if (!isEyedropperMode || !imageRef.current) return;
    
    // 連続したイベントを抑制するためのスロットリング（更に高速化）
    if (previewTimeoutRef.current) {
      clearTimeout(previewTimeoutRef.current);
    }
    
    previewTimeoutRef.current = setTimeout(async () => {
      try {
        // 🎯 **重要**: まず正確な座標変換を行う
        const img = imageRef.current!;
        const { x: canvasX, y: canvasY } = getCanvasCoordinatesFromImageClick(event, img);
        
        // 🎆 デバッグ情報（開発時のみ）
        if (process.env.NODE_ENV === 'development') {
          const rect = img.getBoundingClientRect();
          const displayX = event.clientX - rect.left;
          const displayY = event.clientY - rect.top;
          console.log('💎 Ultra-Precise Coordinates:', {
            display: { x: displayX, y: displayY },
            canvas: { x: canvasX, y: canvasY },
            mouse: { x: event.clientX, y: event.clientY },
            devicePixelRatio: window.devicePixelRatio
          });
        }
        
        // 🎨 正確な座標で色を抽出
        const extractedColor = await handleImageEyedropper(event, img);
        
        // 💎 **極限精度**: カーソルの右上に完璧配置（1ピクセル単位で調整）
        // デバイスピクセル比も考慮した超精密位置計算
        const pixelRatio = window.devicePixelRatio || 1;
        const baseOffsetX = 25; // 右側基本オフセット
        const baseOffsetY = -90; // 上側基本オフセット
        
        // 高DPIディスプレイでの微調整
        const adjustedOffsetX = Math.round(baseOffsetX * (pixelRatio >= 2 ? 0.9 : 1));
        const adjustedOffsetY = Math.round(baseOffsetY * (pixelRatio >= 2 ? 0.95 : 1));
        
        const mouseX = event.clientX + adjustedOffsetX;
        const mouseY = event.clientY + adjustedOffsetY;
        
        // 🖥️ 画面境界チェック（はみ出し完全防止）
        const finalX = Math.min(mouseX, window.innerWidth - 160); // プレビューサイズ考慮
        const finalY = Math.max(mouseY, 10); // 上端保護
        
        // 色プレビューを設定
        setPreviewColor({
          hex: extractedColor.hex,
          x: finalX,
          y: finalY
        });
        
        // 🔍 **統一された座標系**で拡大プレビューを生成
        const magnifiedData = await generateMagnifiedPreview(event);
        if (magnifiedData) {
          setMagnifiedPreview({
            imageData: magnifiedData,
            x: finalX,
            y: finalY
          });
        }
      } catch (error) {
        // エラーは無視してプレビューを非表示
        setPreviewColor(null);
        setMagnifiedPreview(null);
      }
    }, 20); // 20msに短縮して更に高速反応
  }, [isEyedropperMode, generateMagnifiedPreview]);

  // マウスが画像から離れたときにプレビューを非表示
  const handleImageMouseLeave = useCallback(() => {
    // プレビューを非表示
    setPreviewColor(null);
    setMagnifiedPreview(null);
    
    // タイマーをクリア
    if (previewTimeoutRef.current) {
      clearTimeout(previewTimeoutRef.current);
      previewTimeoutRef.current = null;
    }
  }, []);

  // 抽出した色を削除
  const handleRemoveExtractedColor = useCallback((colorToRemove: ColorInfo) => {
    setExtractedColors(prev => prev.filter(color => color.hex !== colorToRemove.hex));
  }, []);

  // スポイトモードの切り替え
  const toggleEyedropperMode = useCallback(() => {
    setIsEyedropperMode(prev => !prev);
  }, []);

  // 画像表示の切り替え
  const toggleImageDisplay = useCallback(() => {
    setShowImage(prev => !prev);
    // 画像を非表示にしたときはスポイトモードをオフ
    if (showImage) {
      setIsEyedropperMode(false);
      setPreviewColor(null);
      setMagnifiedPreview(null);
    }
  }, [showImage]);

  // 🧹 クリーンアップ処理
  useEffect(() => {
    return () => {
      // タイマーをクリア
      if (previewTimeoutRef.current) {
        clearTimeout(previewTimeoutRef.current);
      }
    };
  }, []);

  // エクスポート処理
  const handleExport = useCallback(async (format: string) => {
    const allColors = [...palette.colors, ...mixedColors];
    let exportData = '';
    let filename = `${palette.name || 'palette'}.${format}`;
    
    switch (format) {
      case 'css':
        exportData = exportToCss(allColors, palette.name);
        break;
      case 'json':
        exportData = exportToJson(allColors, palette.name);
        break;
      case 'text':
        exportData = allColors.map(color => color.hex).join('\n');
        filename = `${palette.name || 'palette'}.txt`;
        break;
    }
    
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
  }, [palette, mixedColors]);

  // 共有処理
  const handleShare = useCallback(() => {
    const allColors = [...palette.colors, ...mixedColors];
    if (navigator.share) {
      navigator.share({
        title: `🎨 ${palette.name}`,
        text: `すてきな色をみつけたよ！\n${allColors.map(c => c.hex).join(', ')}`,
        url: window.location.href
      });
    } else {
      copyToClipboard(window.location.href);
    }
    
    onShare?.();
  }, [palette, mixedColors, onShare]);

  // 混ぜた色とスポイトでとった色も含めてすべての色を表示
  const allColors = [...palette.colors, ...extractedColors, ...mixedColors];

  return (
    <div className="w-full space-y-6 theme-elementary">

      {/* 🎨 **完全修正版**スマート拡大プレビュー（カーソル右上に正確配置） */}
      {previewColor && magnifiedPreview && (
        <div
          className="fixed z-50 pointer-events-none animate-in zoom-in duration-150"
          style={{
            // 🎯 **カーソルの右上に配置**（はみ出し防止付き）
            left: Math.min(previewColor.x, window.innerWidth - 140), // 右端はみ出し防止
            top: Math.max(previewColor.y, 10), // 上端はみ出し防止
            transform: 'translateZ(0)', // GPUアクセラレーション
            willChange: 'transform' // パフォーマンス最適化
          }}
        >
          <div className="theme-card rounded-lg shadow-2xl border-2 border-yellow-400 p-2 relative overflow-hidden backdrop-blur-sm bg-white/95 dark:bg-gray-800/95">
            {/* カラーコード表示 */}
            <div className="text-center mb-1">
              <div className="flex items-center justify-center space-x-1">
                <div
                  className="w-3 h-3 rounded border-2 theme-border shadow-sm"
                  style={{ backgroundColor: previewColor.hex }}
                />
                <span className="text-xs font-mono font-bold theme-text-primary tracking-wider">
                  {previewColor.hex.toUpperCase()}
                </span>
              </div>
            </div>
            
            {/* 🔍 拡大プレビュー画像（最適化） */}
            <div className="relative">
              <img
                src={magnifiedPreview.imageData}
                alt="Magnified preview"
                className="w-20 h-20 border-2 theme-border rounded-md shadow-inner"
                style={{ 
                  imageRendering: 'crisp-edges'
                }}
              />
              
              {/* 🎪 プレビュー範囲表示 */}
              <div className="absolute inset-0 border border-yellow-300/50 rounded-md pointer-events-none"></div>
            </div>
          </div>
        </div>
      )}

      {/* メイン2カラムレイアウト：左側=画像（さらに小）、右側=色混ぜコーナー（さらに大） */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* 左側：📸🖼️ 元画像表示（1/4幅） */}
        {showImage && palette.imageUrl && (
          <div className="order-2 lg:order-1 lg:col-span-3">
            <div className="theme-bg-image rounded-2xl p-4 relative">
              {/* 画像表示切り替えボタン（右上） */}
              <button
                onClick={toggleImageDisplay}
                className="absolute top-3 right-3 z-10 p-2 theme-card backdrop-blur-sm hover:shadow-lg rounded-full shadow-lg transition-all duration-300 hover:scale-110 cursor-pointer"
                title="画像を非表示にする"
              >
                <EyeOff className="h-4 w-4 theme-text-secondary" />
              </button>
              {/* ファイル名表示 */}
              {palette.fileName && (
                <p className="text-sm font-medium theme-text-secondary mb-4 text-center truncate">
                  {palette.fileName}
                </p>
              )}
              
              <div className="relative flex justify-center items-center min-h-[180px] lg:min-h-[240px] theme-section rounded-xl">
                <img 
                  ref={imageRef}
                  src={palette.imageUrl} 
                  alt={palette.name}
                  onClick={handleImageClick}
                  onMouseMove={handleImageMouseMove}
                  onMouseLeave={handleImageMouseLeave}
                  className={`max-w-full max-h-48 lg:max-h-64 object-contain rounded-xl transition-all duration-300 ${
                    isEyedropperMode 
                      ? 'cursor-crosshair border-4 border-yellow-400 shadow-lg' 
                      : 'shadow-lg'
                  }`}
                />
                {isEyedropperMode && (
                  <div className="absolute top-2 right-2 bg-yellow-400 text-white p-2 rounded-full">
                    <Droplets className="h-4 w-4" />
                  </div>
                )}
              </div>
              
              {/* 🎨 スポイトボタン（写真セクションの下部右側） */}
              <div className="flex justify-end mt-3">
                <button
                onClick={toggleEyedropperMode}
                className={`px-3 py-2 font-bold rounded-full shadow-lg transform transition-all duration-300 hover:scale-105 text-sm flex items-center space-x-1 cursor-pointer theme-elementary-button ${
                isEyedropperMode
                ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white ring-2 ring-yellow-300'
                : 'bg-gradient-to-r from-gray-300 to-gray-400 hover:from-yellow-400 hover:to-orange-500 text-gray-700 hover:text-white'
                }`}
                >
                  <Droplets className="h-4 w-4" />
                  <span>スポイト</span>
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* 左側：画像非表示時のプレースホルダー（１/４幅） */}
        {!showImage && palette.imageUrl && (
          <div className="order-2 lg:order-1 lg:col-span-2">
            <div className="theme-section rounded-2xl p-3 min-h-[120px] lg:min-h-[150px] flex flex-col items-center justify-center relative">
              {/* 画像表示ボタン */}
              <button
                onClick={toggleImageDisplay}
                className="p-3 theme-card backdrop-blur-sm hover:shadow-lg rounded-full shadow-lg transition-all duration-300 hover:scale-110 mb-2 cursor-pointer"
                title="画像を表示する"
              >
                <Eye className="h-6 w-6 theme-text-secondary" />
              </button>
              <p className="text-xs theme-text-muted text-center theme-elementary-text">
                画像が非表示中
              </p>
              <p className="text-xs theme-text-muted text-center mt-1 theme-elementary-text">
                目のアイコンで表示
              </p>
            </div>
          </div>
        )}
        
        {/* 右側：🎨 色混ぜコーナー（3/4幅） */}
        <div className={`order-1 lg:order-2 ${
          showImage && palette.imageUrl 
            ? 'lg:col-span-9' 
            : palette.imageUrl 
            ? 'lg:col-span-10'
            : 'lg:col-span-12'
        }`}>
          <div className="theme-bg-mixer rounded-2xl">
            <ElementaryColorMixer
              colors={palette.colors.map(c => ({ ...c, id: c.id || generateColorId() }))}
              extractedColors={extractedColors}
              onColorMixed={handleColorMixed}
              onColorExtracted={(color) => {
                // 🔧 修正: お気に入りパレットへの重複チェックはお気に入りパレット内と元画像の色のみで行う
                const paletteOnlyColors = [...palette.colors, ...extractedColors];
                const isDuplicate = paletteOnlyColors.some(existingColor => existingColor.hex === color.hex);
                
                if (isDuplicate) {
                  setDuplicateNotification(`お気に入りパレットに同じ色（${color.hex}）があるよ！`);
                  setTimeout(() => setDuplicateNotification(null), 2000);
                  return;
                }
                
                // 抽出した色を追加
                setExtractedColors(prev => [color, ...prev].slice(0, 8)); // 最大8個まで
                
                // キラキラエフェクト
                setSparkleColor(color.hex);
                setTimeout(() => setSparkleColor(null), 800);
              }}
              onColorRemoved={handleRemoveExtractedColor}
              theme="elementary"
              onSave={onSave}
              onShare={handleShare}
              onReset={onReset}
              showExportMenu={showExportMenu}
              onToggleExportMenu={() => setShowExportMenu(!showExportMenu)}
              onExport={handleExport}
            />
          </div>
        </div>
      </div>

      {/* 重複通知 */}
      {duplicateNotification && (
        <div className="theme-warning border-l-4 p-4 rounded-lg mb-4">
          <div className="flex items-center">
            <div className="mr-2">⚠️</div>
            <p className="font-medium">
              {duplicateNotification}
            </p>
          </div>
        </div>
      )}

      {/* 作った色のギャラリー */}
      {mixedColors.length > 0 && (
        <div className="theme-bg-gallery rounded-2xl p-4 shadow-xl border-2 border-green-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold theme-text-primary theme-elementary-heading">
              ✨ つくった色のコレクション ({mixedColors.length}/30色)
            </h2>
            <button
              onClick={handleClearAllMixedColors}
              className="px-3 py-1 bg-red-400 hover:bg-red-500 text-white text-sm font-bold rounded-full transition-colors flex items-center cursor-pointer theme-elementary-button"
              title="全ての混ぜた色を削除"
            >
              <Trash2 className="h-3 w-3 mr-1" />
              全削除
            </button>
          </div>
          
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2 lg:gap-3">
            {mixedColors.map((color, index) => (
              <div
                key={`mixed-${color.hex}-${index}`}
                className="group relative transform transition-all duration-300 hover:scale-110"
              >
                {/* 削除ボタン */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveMixedColor(color, index);
                  }}
                  className="absolute -top-2 -right-2 z-10 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-lg cursor-pointer"
                  title="この色を削除"
                >
                  <X className="h-3 w-3" />
                </button>
                
                <div
                  className={`aspect-square rounded-xl shadow-lg border-2 border-white relative overflow-hidden cursor-pointer ${
                    sparkleColor === color.hex ? 'animate-pulse ring-4 ring-yellow-400' : ''
                  }`}
                  style={{ backgroundColor: color.hex }}
                  onClick={() => handleColorClick(color.hex)}
                >
                  {/* 混合アイコン */}
                  <div className="absolute top-1 right-1 bg-yellow-400 rounded-full p-0.5">
                    <Sparkles className="h-3 w-3 text-white" />
                  </div>
                  
                  {/* キラキラエフェクト */}
                  {sparkleColor === color.hex && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Sparkles className="h-6 w-6 text-yellow-300 animate-spin" />
                    </div>
                  )}
                  
                  {/* ホバー時のコピーアイコン */}
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <Copy className="h-4 w-4 text-white" />
                  </div>
                </div>
                
                {/* 色の情報 */}
                <div className="text-center mt-1">
                  <p className="text-xs theme-text-secondary font-mono">
                    {color.hex}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* クイックプレビューストライプ */}
      <div className="theme-section rounded-xl p-3">
        <h3 className="text-sm font-bold text-center mb-2 theme-text-primary theme-elementary-heading">
          🌈 ぜんぶの色（{allColors.length}色）
        </h3>
        <div className="flex h-8 rounded-lg overflow-hidden shadow-lg">
          {allColors.map((color, index) => (
            <div
              key={`stripe-${color.hex}-${index}`}
              className="flex-1 cursor-pointer hover:opacity-80 transition-opacity"
              style={{ backgroundColor: color.hex }}
              onClick={() => handleColorClick(color.hex)}
              title={`${color.name} (${color.hex})`}
            />
          ))}
        </div>
        <p className="text-xs text-center mt-2 theme-text-muted theme-elementary-text">
          クリックで色をコピーできるよ！
        </p>
      </div>

      {/* 外部クリック時にメニューを閉じる */}
      {showExportMenu && (
        <div
          className="fixed inset-0 z-5"
          onClick={() => setShowExportMenu(false)}
        />
      )}
    </div>
  );
}
