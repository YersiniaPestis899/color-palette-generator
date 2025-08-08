'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { 
  Download, 
  Share2, 
  Save, 
  BookOpen, 
  RotateCcw, 
  Settings,
  ChevronDown,
  ChevronUp,
  Droplets,
  X,
  Trash2
} from 'lucide-react';
import { ColorPalette, PaletteDisplayProps, EducationalMixingResult, ColorInfo } from '../types/color';
import { exportToCss, exportToJson, copyToClipboard } from '../utils/colorUtils';
import { calculateDeltaE2000, calculateDeltaE94, checkWCAGCompliance } from '../utils/advancedColorUtils';
import { handleImageEyedropper, getCanvasCoordinatesFromImageClick } from '../utils/imageUtils';

// 教育的コンポーネントをインポート
import MiddleSchoolColorMixer from './educational/MiddleSchoolColorMixer';
import ColorWheelDisplay from './educational/ColorWheelDisplay';
import ColorTheoryPanel from './educational/ColorTheoryPanel';

export default function MiddleSchoolPaletteDisplay({ 
  palette, 
  onSave, 
  onShare, 
  theme 
}: PaletteDisplayProps) {
  const [selectedColor, setSelectedColor] = useState(palette.colors[0] || null);
  const [educationalResult, setEducationalResult] = useState<EducationalMixingResult | null>(null);
  // learningMode は削除 - 常に全機能有効
  const [activePanel, setActivePanel] = useState<'mixer' | 'wheel' | 'theory'>('mixer');
  const [showAdvancedFeatures, setShowAdvancedFeatures] = useState(false);
  const [exportFormat, setExportFormat] = useState<'css' | 'json'>('css');
  const [extractedColors, setExtractedColors] = useState<ColorInfo[]>([]);
  const [isEyedropperMode, setIsEyedropperMode] = useState(false);
  const [previewColor, setPreviewColor] = useState<{ hex: string; x: number; y: number } | null>(null);
  const [magnifiedPreview, setMagnifiedPreview] = useState<{ imageData: string; x: number; y: number } | null>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const previewTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // 🔬 Delta E計算結果の状態管理
  const [deltaEResults, setDeltaEResults] = useState<{
    [key: string]: { deltaE2000: number; deltaE94: number; wcag: number };
  }>({});
  const [showDeltaEComparison, setShowDeltaEComparison] = useState(false);
  const [isDeltaECalculating, setIsDeltaECalculating] = useState(false);
  const deltaECalculationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // learningModeConfig は削除 - 常に全機能有効

  // エクスポート処理
  const handleExport = useCallback(async () => {
    let content: string;
    let filename: string;
    
    if (exportFormat === 'css') {
      content = exportToCss(palette.colors, palette.name);
      filename = `${palette.name}.css`;
    } else {
      content = exportToJson(palette.colors, palette.name);
      filename = `${palette.name}.json`;
    }

    // ファイルダウンロード
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [palette, exportFormat]);

  // 色選択ハンドラー
  const handleColorSelect = useCallback((color: any) => {
    setSelectedColor(color);
  }, []);
  
  // 🔬 Delta E値の計算（デバウンス付き高性能版）
  const calculateDeltaEForAllColors = useCallback(() => {
    if (!selectedColor) return;
    
    // 既存の計算をキャンセル
    if (deltaECalculationTimeoutRef.current) {
      clearTimeout(deltaECalculationTimeoutRef.current);
    }
    
    setIsDeltaECalculating(true);
    
    // 🚀 500msのデバウンスで連続計算を防止（UX向上）
    deltaECalculationTimeoutRef.current = setTimeout(() => {
      try {
        const allColors = [...palette.colors, ...extractedColors];
        const results: { [key: string]: { deltaE2000: number; deltaE94: number; wcag: number } } = {};
        
        console.log(`🔬 Delta E計算開始: ${allColors.length}色の比較`);
        const startTime = performance.now();
        
        allColors.forEach((color, index) => {
          if (color.hex !== selectedColor.hex) {
            try {
              console.log(`🔬 計算中 ${index + 1}/${allColors.length}: ${color.hex}`);
              
              const deltaE2000 = calculateDeltaE2000(selectedColor.hex, color.hex);
              const deltaE94 = calculateDeltaE94(selectedColor.hex, color.hex);
              const wcagResult = checkWCAGCompliance(selectedColor.hex, color.hex);
              
              // 結果の妥当性チェック
              if (isFinite(deltaE2000) && isFinite(deltaE94) && isFinite(wcagResult.contrastRatio)) {
                results[color.hex] = {
                  deltaE2000,
                  deltaE94,
                  wcag: wcagResult.contrastRatio
                };
              } else {
                console.warn(`🚨 無効な計算結果をスキップ: ${color.hex}`, { deltaE2000, deltaE94, wcag: wcagResult.contrastRatio });
              }
            } catch (error) {
              console.error(`❌ 色計算エラー ${color.hex}:`, error);
              // エラーの場合は安全なデフォルト値を設定
              results[color.hex] = {
                deltaE2000: 100,
                deltaE94: 100,
                wcag: 1.0
              };
            }
          }
        });
        
        const endTime = performance.now();
        const calculatedCount = Object.keys(results).length;
        console.log(`✅ Delta E計算完了: ${calculatedCount}色, ${(endTime - startTime).toFixed(2)}ms`);
        
        setDeltaEResults(results);
      } catch (error) {
        console.error('❌ Delta E計算エラー:', error);
      } finally {
        setIsDeltaECalculating(false);
      }
    }, 500);
  }, [selectedColor, palette.colors, extractedColors]);

  // Delta E解釈のヘルパー関数
  const getDeltaEInterpretation = useCallback((deltaE: number) => {
    if (deltaE < 1) return { text: "👁️ 同じ色（知覚差なし）", color: "text-green-600", bg: "bg-green-50" };
    if (deltaE < 2) return { text: "🔍 わずかな差（注意深く見ると分かる）", color: "text-blue-600", bg: "bg-blue-50" };
    if (deltaE < 3.5) return { text: "👀 明らかな差（一般的に識別可能）", color: "text-yellow-600", bg: "bg-yellow-50" };
    if (deltaE < 5) return { text: "⚡ 大きな差（すぐに分かる）", color: "text-orange-600", bg: "bg-orange-50" };
    return { text: "🔥 極めて大きな差（全く違う色）", color: "text-red-600", bg: "bg-red-50" };
  }, []);

  // 教育的混色結果ハンドラー
  const handleEducationalMixingResult = useCallback((result: EducationalMixingResult) => {
    setEducationalResult(result);
  }, []);

  // 🔍 拡大プレビューを生成（高品質版・ElementaryPaletteDisplayと同等精度）
  const generateMagnifiedPreview = useCallback(async (event: React.MouseEvent<HTMLImageElement>) => {
    if (!imageRef.current) return null;
    
    const img = imageRef.current;
    
    // 🎯 **重要**: Elementaryと同じ高精度座標変換を使用
    const { x: canvasX, y: canvasY } = getCanvasCoordinatesFromImageClick(event, img);
    
    // 🔬 高精度拡大設定（Elementaryと同等品質）
    const cropSize = 24; // 24x24ピクセルの範囲を拡大（より細かく）
    const displaySize = 96; // 96x96ピクセルで表示（高精細）
    
    // 🎨 高品質キャンバス作成（ElementaryPaletteDisplayと同等）
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { 
      willReadFrequently: true,
      alpha: false,
      desynchronized: true // パフォーマンス最適化
    });
    if (!ctx) return null;
    
    canvas.width = displaySize;
    canvas.height = displaySize;
    
    // 🌟 最高品質描画設定（ElementaryPaletteDisplayと同等）
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
    
    // 🔬 極限精度切り取り範囲を計算（サブピクセル精度）
    const halfCrop = cropSize / 2;
    const sourceX = Math.min(Math.max(0, canvasX - halfCrop), img.naturalWidth - cropSize);
    const sourceY = Math.min(Math.max(0, canvasY - halfCrop), img.naturalHeight - cropSize);
    const actualCropWidth = Math.min(cropSize, img.naturalWidth - sourceX);
    const actualCropHeight = Math.min(cropSize, img.naturalHeight - sourceY);
    
    try {
      // 🔬 極限精度拡大描画（エッジ保存最適化）
      ctx.drawImage(
        tempCanvas,
        sourceX, sourceY, actualCropWidth, actualCropHeight,
        0, 0, displaySize, displaySize
      );
      
      // 🎯 中央に超高精度スポイト位置を示すクロスヘア（ElementaryPaletteDisplayと同等）
      const center = displaySize / 2;
      const crossSize = 8; // やや大きめで見やすく
      
      // シャドウ効果で視認性向上
      ctx.shadowColor = 'rgba(0,0,0,0.8)';
      ctx.shadowBlur = 2;
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;
      
      ctx.strokeStyle = '#FFDF00'; // より明るい金色（ElementaryPaletteDisplayと同様）
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
      
      return canvas.toDataURL('image/png', 1.0); // 最高品質で出力（ElementaryPaletteDisplayと同等）
    } catch (error) {
      console.error('極限精度拡大プレビューの生成に失敗:', error);
      return null;
    }
  }, []);

  // 🔬 スポイト機能：画像から色を抽出
  const handleImageClick = useCallback(async (event: React.MouseEvent<HTMLImageElement>) => {
    if (!isEyedropperMode || !imageRef.current) return;
    
    try {
      const extractedColor = await handleImageEyedropper(event, imageRef.current);
      
      // 重複チェック
      const allColors = [...palette.colors, ...extractedColors];
      const isDuplicate = allColors.some(color => color.hex === extractedColor.hex);
      
      if (isDuplicate) {
        // 大人向けはエラーを表示しないで、静かに無視
        return;
      }
      
      // 抽出した色を追加（最大8個まで）
      setExtractedColors(prev => [extractedColor, ...prev].slice(0, 8));
      
      // 選択色も更新
      setSelectedColor(extractedColor);
      
      // プレビューを非表示
      setPreviewColor(null);
      setMagnifiedPreview(null);
      
    } catch (error) {
      console.error('色の抽出に失敗しました:', error);
    }
  }, [isEyedropperMode, palette.colors, extractedColors]);

  // 🔍 リアルタイムプレビュー機能
  const handleImageMouseMove = useCallback(async (event: React.MouseEvent<HTMLImageElement>) => {
    if (!isEyedropperMode || !imageRef.current) return;
    
    // 連続したイベントを抑制するためのスロットリング
    if (previewTimeoutRef.current) {
      clearTimeout(previewTimeoutRef.current);
    }
    
    previewTimeoutRef.current = setTimeout(async () => {
      try {
        // 🎯 **重要**: まず正確な座標変換を行う（ElementaryPaletteDisplayと同等）
        const img = imageRef.current!;
        const { x: canvasX, y: canvasY } = getCanvasCoordinatesFromImageClick(event, img);
        
        // 🎨 正確な座標で色を抽出
        const extractedColor = await handleImageEyedropper(event, img);
        
        // 🔬 デバッグ情報（開発時のみ）
        if (process.env.NODE_ENV === 'development') {
          const rect = img.getBoundingClientRect();
          const displayX = event.clientX - rect.left;
          const displayY = event.clientY - rect.top;
          console.log('🔬 Ultra-Precise Coordinates (Middle School):', {
            display: { x: displayX, y: displayY },
            canvas: { x: canvasX, y: canvasY },
            mouse: { x: event.clientX, y: event.clientY },
            devicePixelRatio: window.devicePixelRatio
          });
        }
        
        // 🔬 **極限精度**: カーソルの右上に完璧配置（1ピクセル単位で調整）
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
    }, 20); // 20msに短縮してElementaryPaletteDisplayと同等の高速反応
  }, [isEyedropperMode, generateMagnifiedPreview]);

  // マウスが画像から離れたときにプレビューを非表示
  const handleImageMouseLeave = useCallback(() => {
    setPreviewColor(null);
    setMagnifiedPreview(null);
    if (previewTimeoutRef.current) {
      clearTimeout(previewTimeoutRef.current);
      previewTimeoutRef.current = null;
    }
  }, []);

  // 抽出した色を削除
  const handleRemoveExtractedColor = useCallback((colorToRemove: ColorInfo, index: number) => {
    setExtractedColors(prev => {
      const newColors = prev.filter((_, i) => i !== index);
      // 削除した色が選択中の場合、別の色を選択
      if (selectedColor?.hex === colorToRemove.hex) {
        setSelectedColor(newColors[0] || palette.colors[0] || null);
      }
      return newColors;
    });
  }, [selectedColor, palette.colors]);

  // スポイトモードの切り替え
  const toggleEyedropperMode = useCallback(() => {
    setIsEyedropperMode(prev => {
      const newMode = !prev;
      
      // スポイトモードを終了した時、Delta E計算を再実行
      if (!newMode && selectedColor && showAdvancedFeatures && showDeltaEComparison) {
        setTimeout(() => {
          console.log('🎯 Eyedropper終了: Delta E計算を再開');
          calculateDeltaEForAllColors();
        }, 100); // 短い遅延で状態更新後に実行
      }
      
      return newMode;
    });
  }, [selectedColor, showAdvancedFeatures, showDeltaEComparison, calculateDeltaEForAllColors]);

  // 🔬 選択色変更時のDelta E再計算（Eyedropper使用中は無効化）
  useEffect(() => {
    // 🚀 パフォーマンス最適化: Eyedropper使用中はDelta E計算をスキップ
    if (isEyedropperMode) {
      console.log('🎯 Eyedropper使用中: Delta E計算をスキップしてパフォーマンス向上');
      return;
    }
    
    // 高度な機能が無効な場合もスキップ
    if (!showAdvancedFeatures || !showDeltaEComparison) {
      return;
    }
    
    calculateDeltaEForAllColors();
  }, [calculateDeltaEForAllColors, isEyedropperMode, showAdvancedFeatures, showDeltaEComparison]);

  // 🧹 クリーンアップ処理（メモリリーク防止）
  useEffect(() => {
    return () => {
      if (previewTimeoutRef.current) {
        clearTimeout(previewTimeoutRef.current);
      }
      if (deltaECalculationTimeoutRef.current) {
        clearTimeout(deltaECalculationTimeoutRef.current);
      }
    };
  }, []);

  // パネル切り替えボタン
  const panelButtons = [
    { key: 'mixer', label: '🧪 ミキサー', icon: '🧪' },
    { key: 'wheel', label: '🎡 色相環', icon: '🎡' },
    { key: 'theory', label: '📚 理論', icon: '📚' }
  ] as const;

  return (
    <div className="space-y-6 px-4 sm:px-6 lg:px-8">
      {/* 🎓 教育モード ヘッダー */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-2xl border-4 border-indigo-300">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center">
            <div className="p-3 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full mr-4">
              <BookOpen className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                🎓 {palette.name} - 科学的分析
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                色彩の科学を探求し、混色実験を通して学習しましょう
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* モード選択は削除 - 常に全機能有効 */}

            {/* 高度な機能切り替え */}
            <button
              onClick={() => setShowAdvancedFeatures(!showAdvancedFeatures)}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors cursor-pointer"
            >
              <Settings className="h-4 w-4" />
              <span className="text-sm">高度な機能</span>
              {showAdvancedFeatures ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {/* 🎨 元画像とパレット表示（パレット主役レイアウト） */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-6">
          {/* 元画像（1/5幅） */}
          {palette.imageUrl && (
            <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 lg:col-span-1">
              {/* ファイル名表示 */}
              {palette.fileName && (
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-3 text-center truncate">
                  {palette.fileName}
                </p>
              )}
              
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-gray-800 dark:text-white">📸 元画像</h3>
              </div>
              
              {isEyedropperMode && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-2 mb-3">
                  <p className="text-blue-800 dark:text-blue-200 text-sm font-medium">
                    🔍 画像をクリックして色を抽出
                  </p>
                </div>
              )}
              
              <div className="relative flex justify-center items-center min-h-[180px] bg-gray-100 dark:bg-gray-700 rounded-lg">
                <img 
                  ref={imageRef}
                  src={palette.imageUrl} 
                  alt={palette.name}
                  onClick={handleImageClick}
                  onMouseMove={handleImageMouseMove}
                  onMouseLeave={handleImageMouseLeave}
                  className={`max-w-full max-h-48 object-contain rounded-lg shadow-md transition-all duration-300 ${
                    isEyedropperMode 
                      ? 'cursor-crosshair border-2 border-blue-400' 
                      : ''
                  }`}
                />
                {isEyedropperMode && (
                  <div className="absolute top-2 right-2 bg-blue-500 text-white p-1.5 rounded-full shadow-lg">
                    <Droplets className="h-3 w-3" />
                  </div>
                )}
              </div>
              
              {/* 🔬 スポイトボタン（写真セクションの下部右側） */}
              <div className="flex justify-end mt-3">
                <button
                  onClick={toggleEyedropperMode}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 text-sm shadow-md hover:shadow-lg transform hover:scale-105 ${
                    isEyedropperMode
                      ? 'bg-blue-500 text-white ring-2 ring-blue-300'
                      : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-blue-500 hover:text-white'
                  }`}
                >
                  <Droplets className="h-4 w-4" />
                  <span>Eyedropper</span>
                </button>
              </div>
            </div>
          )}

          {/* 抽出された色（3/5幅） */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 lg:col-span-3">
            <h3 className="font-bold text-gray-800 dark:text-white mb-3">
              🎨 抽出色 ({palette.colors.length + extractedColors.length}色)
            </h3>
            
            {/* オリジナル抽出色 */}
            <div className="mb-4">
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 font-medium">• 自動抽出 ({palette.colors.length}色)</p>
              <div className="grid grid-cols-5 gap-2">
                {palette.colors.map((color, index) => (
                  <button
                    key={`original-${index}`}
                    onClick={() => setSelectedColor(color)}
                    className={`aspect-square rounded-lg transition-all duration-200 hover:scale-105 shadow-md border-2 ${
                      selectedColor?.hex === color.hex 
                        ? 'border-indigo-400 scale-105 ring-2 ring-indigo-300' 
                        : 'border-white dark:border-gray-600'
                    }`}
                    style={{ backgroundColor: color.hex }}
                    title={`${color.name} (${color.hex})`}
                  />
                ))}
              </div>
            </div>
            
            {/* スポイト抽出色 */}
            {extractedColors.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">• スポイト抽出 ({extractedColors.length}色)</p>
                  <button
                    onClick={() => setExtractedColors([])}
                    className="flex items-center space-x-1 px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 rounded text-xs font-medium transition-colors"
                  >
                    <Trash2 className="h-3 w-3" />
                    <span>全削除</span>
                  </button>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {extractedColors.map((color, index) => (
                    <div key={`extracted-${index}`} className="relative group">
                      <button
                        onClick={() => setSelectedColor(color)}
                        className={`w-full aspect-square rounded-lg transition-all duration-200 hover:scale-105 shadow-md border-2 ${
                          selectedColor?.hex === color.hex 
                            ? 'border-blue-400 scale-105 ring-2 ring-blue-300' 
                            : 'border-white dark:border-gray-600'
                        }`}
                        style={{ backgroundColor: color.hex }}
                        title={`${color.name} (${color.hex})`}
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveExtractedColor(color, index);
                        }}
                        className="absolute -top-1 -right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-lg"
                        title="この色を削除"
                      >
                        <X className="h-2 w-2" />
                      </button>
                      <div className="absolute bottom-0 right-0 bg-blue-400 rounded-full p-0.5">
                        <Droplets className="h-2 w-2 text-white" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* 選択色の詳細 */}
            {selectedColor && (
              <div className="mt-4 p-3 bg-white dark:bg-gray-800 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
                    style={{ backgroundColor: selectedColor.hex }}
                  />
                  <div>
                    <p className="font-bold text-sm text-gray-800 dark:text-white">
                      {selectedColor.name}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {selectedColor.hex} | RGB({selectedColor.rgb.r}, {selectedColor.rgb.g}, {selectedColor.rgb.b})
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      HSL({selectedColor.hsl.h}°, {selectedColor.hsl.s}%, {selectedColor.hsl.l}%)
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* アクション（1/5幅） */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 lg:col-span-1">
            <h3 className="font-bold text-gray-800 dark:text-white mb-3">⚡ アクション</h3>
            <div className="space-y-3">
              <button
                onClick={onSave}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
              >
                <Save className="h-4 w-4" />
                <span>パレットを保存</span>
              </button>

              <div className="flex space-x-2">
                <select
                  value={exportFormat}
                  onChange={(e) => setExportFormat(e.target.value as 'css' | 'json')}
                  className="flex-1 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
                >
                  <option value="css">CSS形式</option>
                  <option value="json">JSON形式</option>
                </select>
                <button
                  onClick={handleExport}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                  title="エクスポート"
                >
                  <Download className="h-4 w-4" />
                </button>
              </div>

              <button
                onClick={onShare}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors"
              >
                <Share2 className="h-4 w-4" />
                <span>共有する</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 📚 学習パネル切り替え */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-lg">
        <div className="flex flex-wrap justify-center gap-2 mb-4">
          {panelButtons.map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => setActivePanel(key)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                activePanel === key
                  ? 'bg-indigo-500 text-white shadow-lg scale-105'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <span>{icon}</span>
              <span className="text-sm">{label}</span>
            </button>
          ))}
        </div>

        {/* アクティブなパネルを表示 */}
        <div className="min-h-[400px]">
          {activePanel === 'mixer' && (
            <MiddleSchoolColorMixer
              colors={[...palette.colors, ...extractedColors]} // 🎨 すべての色をミキサーで使用可能にする
              extractedColors={extractedColors} // 🔍 スポイト抽出色の管理
              onColorMixed={() => {}} // 既存の色配列は変更しない
              onColorExtracted={(color) => { // 🎨 混色結果を抽出色に追加
                setExtractedColors(prev => [color, ...prev].slice(0, 8));
              }}
              onColorRemoved={(colorToRemove) => {
                // 🎨 抽出色の削除機能 - indexを見つけて削除
                const index = extractedColors.findIndex(color => color.hex === colorToRemove.hex);
                if (index !== -1) {
                  handleRemoveExtractedColor(colorToRemove, index);
                }
              }}
              onEducationalMixingResult={handleEducationalMixingResult}
              theme={theme}
              showTheory={true}
              showColorWheel={true}
              // learningMode は削除 - 常に全機能有効
            />
          )}

          {activePanel === 'wheel' && (
            <ColorWheelDisplay
              selectedColor={selectedColor}
              onColorSelect={handleColorSelect}
              showHarmonyLines={true} // 常に表示
              showAngles={true} // 常に表示
              size={showAdvancedFeatures ? 400 : 300}
            />
          )}

          {activePanel === 'theory' && (
            <ColorTheoryPanel
              mixingResult={educationalResult}
              selectedColors={selectedColor ? [selectedColor] : palette.colors.slice(0, 3)}
              showDetailedExplanations={true} // 常に詳細表示
              learningLevel="advanced" // 常に高度レベル
            />
          )}
        </div>
      </div>

      {/* 🔬 高度な機能（展開時のみ表示） */}
      {showAdvancedFeatures && (
        <div className="bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800 dark:to-blue-900/20 rounded-2xl p-6 shadow-lg">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center">
            🔬 高度な分析機能
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* 統計情報 */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4">
              <h4 className="font-bold text-gray-800 dark:text-white mb-3">📊 色彩統計</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">色数:</span>
                  <span className="font-medium">{palette.colors.length}色</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">色相範囲:</span>
                  <span className="font-medium">
                    {Math.min(...palette.colors.map(c => c.hsl.h))}° - {Math.max(...palette.colors.map(c => c.hsl.h))}°
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">平均彩度:</span>
                  <span className="font-medium">
                    {Math.round(palette.colors.reduce((sum, c) => sum + c.hsl.s, 0) / palette.colors.length)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">平均明度:</span>
                  <span className="font-medium">
                    {Math.round(palette.colors.reduce((sum, c) => sum + c.hsl.l, 0) / palette.colors.length)}%
                  </span>
                </div>
              </div>
            </div>

            {/* 🔬 Delta E比較分析 */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-bold text-gray-800 dark:text-white flex items-center space-x-2">
                  <span>🔬 色差分析（Delta E）</span>
                  {isDeltaECalculating && (
                    <div className="flex items-center space-x-1">
                      <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                      <span className="text-xs text-blue-600 dark:text-blue-400">計算中...</span>
                    </div>
                  )}
                  {isEyedropperMode && (
                    <div className="flex items-center space-x-1">
                      <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                      <span className="text-xs text-orange-600 dark:text-orange-400">スポイト使用中（計算無効）</span>
                    </div>
                  )}
                </h4>
                <button
                  onClick={() => setShowDeltaEComparison(!showDeltaEComparison)}
                  className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50 rounded-lg text-sm font-medium transition-colors"
                >
                  {showDeltaEComparison ? '非表示' : '詳細表示'}
                </button>
              </div>
              
              {selectedColor ? (
                <div className="space-y-3">
                  {/* 基準色表示 */}
                  <div className="flex items-center space-x-3 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div
                      className="w-6 h-6 rounded border border-gray-300 dark:border-gray-500"
                      style={{ backgroundColor: selectedColor.hex }}
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800 dark:text-white">
                        基準色: {selectedColor.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {selectedColor.hex}
                      </p>
                    </div>
                  </div>

                  {/* Delta E概要 */}
                  <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                    <p>• ΔE &lt; 1: 同じ色に見える</p>
                    <p>• ΔE &lt; 3: 微細な差</p>
                    <p>• ΔE &lt; 5: 明らかな差</p>
                    <p>• ΔE ≥ 5: 大きく異なる色</p>
                  </div>

                  {/* Delta E結果サマリー */}
                  {Object.keys(deltaEResults).length > 0 && (
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        色差範囲（ΔE 2000）:
                      </p>
                      <div className="text-sm">
                        <span className="text-blue-600 dark:text-blue-400 font-medium">
                          {Math.min(...Object.values(deltaEResults).map(r => r.deltaE2000)).toFixed(1)} -
                          {Math.max(...Object.values(deltaEResults).map(r => r.deltaE2000)).toFixed(1)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                  色を選択してDelta E分析を開始
                </p>
              )}
            </div>

            {/* 推奨用途 */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4">
              <h4 className="font-bold text-gray-800 dark:text-white mb-3">💡 推奨用途</h4>
              <div className="space-y-2">
                {/* 簡易的な用途推定 */}
                {palette.colors.some(c => c.hsl.h >= 0 && c.hsl.h <= 30) && (
                  <div className="px-3 py-2 bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300 rounded-lg text-sm">
                    🔴 エネルギッシュなデザイン
                  </div>
                )}
                {palette.colors.some(c => c.hsl.h >= 200 && c.hsl.h <= 240) && (
                  <div className="px-3 py-2 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 rounded-lg text-sm">
                    🔵 信頼感のあるデザイン
                  </div>
                )}
                {palette.colors.some(c => c.hsl.h >= 90 && c.hsl.h <= 150) && (
                  <div className="px-3 py-2 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 rounded-lg text-sm">
                    🟢 自然・環境系デザイン
                  </div>
                )}
                {palette.colors.every(c => c.hsl.s < 30) && (
                  <div className="px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 rounded-lg text-sm">
                    ⚫ ミニマル・モダンデザイン
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🔬 Delta E詳細比較テーブル */}
      {showAdvancedFeatures && showDeltaEComparison && selectedColor && Object.keys(deltaEResults).length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center">
              🔬 Delta E詳細比較テーブル
            </h3>
            <div className="flex items-center space-x-2">
              <div
                className="w-4 h-4 rounded border border-gray-300 dark:border-gray-500"
                style={{ backgroundColor: selectedColor.hex }}
              />
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                基準: {selectedColor.name}
              </span>
            </div>
          </div>

          {/* Delta E理論説明 */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 mb-6">
            <h4 className="font-bold text-gray-800 dark:text-white mb-3 flex items-center">
              📚 Delta E とは？
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-400">
              <div>
                <h5 className="font-medium text-gray-800 dark:text-white mb-2">🎯 CIE 2000 (最新・高精度)</h5>
                <p>国際照明委員会が定めた最新の色差計算式。人間の視覚により近い結果を提供します。</p>
              </div>
              <div>
                <h5 className="font-medium text-gray-800 dark:text-white mb-2">📊 CIE 94 (従来方式)</h5>
                <p>従来から使用される色差計算式。工業分野で広く使われています。</p>
              </div>
              <div>
                <h5 className="font-medium text-gray-800 dark:text-white mb-2">♿ WCAG コントラスト比</h5>
                <p>Webアクセシビリティのコントラスト比。4.5:1以上がAA基準です。</p>
              </div>
              <div>
                <h5 className="font-medium text-gray-800 dark:text-white mb-2">🎨 実用的な指針</h5>
                <p>ΔE &lt; 1: 同じ色、ΔE &lt; 3: 微細な差、ΔE &lt; 5: 明らかな差</p>
              </div>
            </div>
          </div>

          {/* 詳細比較テーブル */}
          <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-bold text-gray-800 dark:text-white">色</th>
                    <th className="px-4 py-3 text-left text-sm font-bold text-gray-800 dark:text-white">名前</th>
                    <th className="px-4 py-3 text-center text-sm font-bold text-gray-800 dark:text-white">ΔE 2000</th>
                    <th className="px-4 py-3 text-center text-sm font-bold text-gray-800 dark:text-white">ΔE 94</th>
                    <th className="px-4 py-3 text-center text-sm font-bold text-gray-800 dark:text-white">WCAG</th>
                    <th className="px-4 py-3 text-left text-sm font-bold text-gray-800 dark:text-white">知覚差</th>
                  </tr>
                </thead>
                <tbody>
                  {[...palette.colors, ...extractedColors]
                    .filter(color => color.hex !== selectedColor.hex && deltaEResults[color.hex])
                    .sort((a, b) => deltaEResults[a.hex].deltaE2000 - deltaEResults[b.hex].deltaE2000)
                    .map((color, index) => {
                      const result = deltaEResults[color.hex];
                      const interpretation = getDeltaEInterpretation(result.deltaE2000);
                      
                      return (
                        <tr 
                          key={`delta-e-${color.hex}-${index}`}
                          className="border-t border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center space-x-3">
                              <div
                                className="w-8 h-8 rounded border-2 border-white dark:border-gray-600 shadow-sm"
                                style={{ backgroundColor: color.hex }}
                              />
                              <span className="text-xs font-mono text-gray-600 dark:text-gray-400">
                                {color.hex}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm font-medium text-gray-800 dark:text-white">
                              {color.name}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold ${interpretation.color} ${interpretation.bg}`}>
                              {result.deltaE2000.toFixed(2)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="text-sm font-medium text-gray-800 dark:text-white">
                              {result.deltaE94.toFixed(2)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold ${
                              result.wcag >= 4.5 
                                ? 'text-green-600 bg-green-50' 
                                : result.wcag >= 3.0 
                                  ? 'text-yellow-600 bg-yellow-50' 
                                  : 'text-red-600 bg-red-50'
                            }`}>
                              {result.wcag.toFixed(1)}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-xs font-medium ${interpretation.color}`}>
                              {interpretation.text}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>

            {/* テーブル下部の説明 */}
            <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 border-t border-gray-200 dark:border-gray-600">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-gray-600 dark:text-gray-400">
                <div>
                  <span className="font-medium">💡 使い方:</span> 
                  色をクリックして基準色を変更できます
                </div>
                <div>
                  <span className="font-medium">🎯 精度:</span> 
                  CIE 2000が最も人間の視覚に近い
                </div>
                <div>
                  <span className="font-medium">♿ アクセシビリティ:</span> 
                  WCAG 4.5以上が推奨
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 💡 学習のヒント */}
      <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-2xl p-4">
        <div className="flex items-center mb-3">
          <div className="p-2 bg-yellow-400 rounded-full mr-3">
            <BookOpen className="h-4 w-4 text-white" />
          </div>
          <h3 className="font-bold text-yellow-800 dark:text-yellow-300">
            💡 学習のヒント
          </h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-yellow-800 dark:text-yellow-300">
          <div>
            <p className="font-medium mb-1">🎨 色の混合実験をしてみよう</p>
            <p>異なる色を組み合わせて、加法混色と減法混色の違いを体験できます。</p>
          </div>
          <div>
            <p className="font-medium mb-1">🔬 Delta E で色差を測定しよう</p>
            <p>高度な機能でDelta E表示を有効にし、色の知覚差を科学的に分析できます。Eyedropper使用中は自動的にDelta E計算が無効化され、スムーズに動作します。</p>
          </div>
          <div>
            <p className="font-medium mb-1">🎡 色相環で関係性を学ぼう</p>
            <p>補色や類似色など、色同士の関係性を色相環で視覚的に確認できます。</p>
          </div>
          <div>
            <p className="font-medium mb-1">📚 理論と実践を組み合わせよう</p>
            <p>学んだ理論を実際のデザインプロジェクトで活用してみましょう。</p>
          </div>
        </div>
      </div>
      
      {/* 🔬 スマート拡大プレビュー（カーソルの右上に統合表示） */}
      {previewColor && magnifiedPreview && (
        <div
          className="fixed z-50 pointer-events-none"
          style={{
            left: previewColor.x + 25,
            top: previewColor.y - 90,
            transform: 'translateZ(0)' // GPUアクセラレーションでスムーズに
          }}
        >
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl border-2 border-blue-400 p-4">
            {/* カラーコード表示 */}
            <div className="text-center mb-3">
              <div className="flex items-center justify-center space-x-3">
                <div
                  className="w-5 h-5 rounded border border-gray-300 dark:border-gray-500 shadow-sm"
                  style={{ backgroundColor: previewColor.hex }}
                />
                <div className="text-left">
                  <div className="text-sm font-mono font-bold text-gray-800 dark:text-gray-200">
                    {previewColor.hex.toUpperCase()}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    High Precision Preview
                  </div>
                </div>
              </div>
            </div>
            
            {/* 拡大プレビュー画像 */}
            <img
              src={magnifiedPreview.imageData}
              alt="Magnified preview"
              className="w-36 h-36 border-2 border-gray-200 dark:border-gray-600 rounded-lg shadow-inner"
            />
          </div>
          
          {/* 三角形の矢印（左上から伸びる） */}
          <div className="absolute bottom-3 left-3 w-0 h-0 border-r-[10px] border-t-[10px] border-transparent border-r-white dark:border-r-gray-800 border-t-white dark:border-t-gray-800 transform rotate-45"></div>
        </div>
      )}
    </div>
  );
}
