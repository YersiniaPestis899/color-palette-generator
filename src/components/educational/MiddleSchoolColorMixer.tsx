'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { 
  Palette, 
  Sparkles, 
  Copy, 
  Trash2, 
  BookOpen, 
  RotateCcw,
  Eye,
  Lightbulb,
  Atom,
  Settings
} from 'lucide-react';
import { 
  ColorInfo, 
  MixedColor, 
  MiddleSchoolColorMixerProps,
  EducationalMixingResult,
  EducationalColorInfo
} from '../../types/color';
import { 
  mixColors, 
  mixMultipleColors, 
  copyToClipboard, 
  generateColorId,
  generateColorMixingAnimation, 
  addColorJitter, 
  calculateAnimationDelay 
} from '../../utils/colorUtils';
import { 
  enhanceColorWithEducationalInfo,
  createEducationalMixingResult,
  getWavelengthDescription,
  getColorNameFromAngle
} from '../../utils/educationalColorUtils';

export default function MiddleSchoolColorMixer({ 
  colors, 
  onColorMixed, 
  onEducationalMixingResult,
  onColorExtracted, // 🎨 抽出色管理機能を追加
  onColorRemoved,   // 🎨 抽出色削除機能を追加
  extractedColors = [], // 🎨 スポイトで抽出した色の配列
  theme,
  showTheory = true,
  showColorWheel = true
}: MiddleSchoolColorMixerProps) {
  // 🔧 3つのミキサー用の状態管理
  const [mixingColors1, setMixingColors1] = useState<ColorInfo[]>([]);
  const [mixingColors2, setMixingColors2] = useState<ColorInfo[]>([]);
  const [mixingColors3, setMixingColors3] = useState<ColorInfo[]>([]);
  const [mixedColor1, setMixedColor1] = useState<MixedColor | null>(null);
  const [mixedColor2, setMixedColor2] = useState<MixedColor | null>(null);
  const [mixedColor3, setMixedColor3] = useState<MixedColor | null>(null);
  const [educationalResult1, setEducationalResult1] = useState<EducationalMixingResult | null>(null);
  const [educationalResult2, setEducationalResult2] = useState<EducationalMixingResult | null>(null);
  const [educationalResult3, setEducationalResult3] = useState<EducationalMixingResult | null>(null);
  
  const [sparkleEffect, setSparkleEffect] = useState<string | null>(null);
  const [dragOverMixer, setDragOverMixer] = useState<number | null>(null);
  const [dragOverExtracted, setDragOverExtracted] = useState<boolean>(false); // 🎨 抽出色エリアのドロップ判定
  const [isAnimating, setIsAnimating] = useState(false);
  const [touchingColor, setTouchingColor] = useState<ColorInfo | null>(null);
  const [selectedColor, setSelectedColor] = useState<EducationalColorInfo | null>(null);
  const [showExplanations, setShowExplanations] = useState(true);
  const [activePanel, setActivePanel] = useState<'theory' | 'wheel' | 'temperature' | null>('theory');

  // 🎨 アニメーション用の状態管理
  const [mixingAnimation1, setMixingAnimation1] = useState<{ hex: string; progress: number }[]>([]);
  const [mixingAnimation2, setMixingAnimation2] = useState<{ hex: string; progress: number }[]>([]);
  const [mixingAnimation3, setMixingAnimation3] = useState<{ hex: string; progress: number }[]>([]);
  const [currentAnimationFrame1, setCurrentAnimationFrame1] = useState<number>(0);
  const [currentAnimationFrame2, setCurrentAnimationFrame2] = useState<number>(0);
  const [currentAnimationFrame3, setCurrentAnimationFrame3] = useState<number>(0);
  const [isAnimatingMixer, setIsAnimatingMixer] = useState<{ [key: number]: boolean }>({});
  
  const mixer1Ref = useRef<HTMLDivElement>(null);
  const mixer2Ref = useRef<HTMLDivElement>(null);
  const mixer3Ref = useRef<HTMLDivElement>(null);
  const processingRef = useRef<boolean>(false);
  const lastMixedRef = useRef<string>('');

  // 🎯 ミキサーごとの状態を取得するヘルパー関数
  const getMixingColors = useCallback((mixerIndex: number): ColorInfo[] => {
    switch (mixerIndex) {
      case 1: return mixingColors1;
      case 2: return mixingColors2;
      case 3: return mixingColors3;
      default: return [];
    }
  }, [mixingColors1, mixingColors2, mixingColors3]);

  const setMixingColors = useCallback((mixerIndex: number, colors: ColorInfo[]) => {
    switch (mixerIndex) {
      case 1: setMixingColors1(colors); break;
      case 2: setMixingColors2(colors); break;
      case 3: setMixingColors3(colors); break;
    }
  }, []);

  const getMixedColor = useCallback((mixerIndex: number): MixedColor | null => {
    switch (mixerIndex) {
      case 1: return mixedColor1;
      case 2: return mixedColor2;
      case 3: return mixedColor3;
      default: return null;
    }
  }, [mixedColor1, mixedColor2, mixedColor3]);

  const setMixedColor = useCallback((mixerIndex: number, color: MixedColor | null) => {
    switch (mixerIndex) {
      case 1: setMixedColor1(color); break;
      case 2: setMixedColor2(color); break;
      case 3: setMixedColor3(color); break;
    }
  }, []);

  const getEducationalResult = useCallback((mixerIndex: number): EducationalMixingResult | null => {
    switch (mixerIndex) {
      case 1: return educationalResult1;
      case 2: return educationalResult2;
      case 3: return educationalResult3;
      default: return null;
    }
  }, [educationalResult1, educationalResult2, educationalResult3]);

  const setEducationalResult = useCallback((mixerIndex: number, result: EducationalMixingResult | null) => {
    switch (mixerIndex) {
      case 1: setEducationalResult1(result); break;
      case 2: setEducationalResult2(result); break;
      case 3: setEducationalResult3(result); break;
    }
  }, []);

  const getMixerRef = useCallback((mixerIndex: number) => {
    switch (mixerIndex) {
      case 1: return mixer1Ref;
      case 2: return mixer2Ref;
      case 3: return mixer3Ref;
      default: return mixer1Ref;
    }
  }, []);

  // 🎨 アニメーション関連のヘルパー関数
  const getMixingAnimation = useCallback((mixerIndex: number) => {
    switch (mixerIndex) {
      case 1: return mixingAnimation1;
      case 2: return mixingAnimation2;
      case 3: return mixingAnimation3;
      default: return [];
    }
  }, [mixingAnimation1, mixingAnimation2, mixingAnimation3]);

  const setMixingAnimation = useCallback((mixerIndex: number, animation: { hex: string; progress: number }[]) => {
    switch (mixerIndex) {
      case 1: setMixingAnimation1(animation); break;
      case 2: setMixingAnimation2(animation); break;
      case 3: setMixingAnimation3(animation); break;
    }
  }, []);

  const getCurrentAnimationFrame = useCallback((mixerIndex: number) => {
    switch (mixerIndex) {
      case 1: return currentAnimationFrame1;
      case 2: return currentAnimationFrame2;
      case 3: return currentAnimationFrame3;
      default: return 0;
    }
  }, [currentAnimationFrame1, currentAnimationFrame2, currentAnimationFrame3]);

  const setCurrentAnimationFrame = useCallback((mixerIndex: number, frame: number) => {
    switch (mixerIndex) {
      case 1: setCurrentAnimationFrame1(frame); break;
      case 2: setCurrentAnimationFrame2(frame); break;
      case 3: setCurrentAnimationFrame3(frame); break;
    }
  }, []);

  // 色をクリック（詳細情報表示 + コピー機能）
  const handleColorClick = useCallback(async (color: ColorInfo) => {
    // 教育的情報を付加
    const educationalColor = enhanceColorWithEducationalInfo(color);
    setSelectedColor(educationalColor);
    
    // コピー機能も保持
    await copyToClipboard(color.hex);
    
    setSparkleEffect(`copy-${color.hex}`);
    setTimeout(() => setSparkleEffect(null), 800);
  }, []);

  // 🎨 段階的なアニメーション混合処理（大人向けアカデミック版）
  const startMixingAnimation = useCallback((colors: ColorInfo[], mixerIndex: number) => {
    // 📝 アニメーション開始時に既存の混合色と教育的結果をクリア
    setMixedColor(mixerIndex, null);
    setEducationalResult(mixerIndex, null);
    setIsAnimatingMixer(prev => ({ ...prev, [mixerIndex]: true }));
    
    // アニメーションフレームを生成（45フレーム、約3秒の詳細なアニメーション）
    const animationFrames = generateColorMixingAnimation(colors, 45);
    setMixingAnimation(mixerIndex, animationFrames);
    setCurrentAnimationFrame(mixerIndex, 0);

    // 累積遅延時間を計算してより正確なタイミング制御
    let cumulativeDelay = 0;
    
    // フレームごとのアニメーション実行
    animationFrames.forEach((frame, index) => {
      const frameDelay = calculateAnimationDelay(index, animationFrames.length);
      cumulativeDelay += frameDelay;
      
      setTimeout(() => {
        // 細かいムラを追加して自然な混合感を演出
        const jitteredHex = addColorJitter(frame.hex, 0.02);
        setCurrentAnimationFrame(mixerIndex, index);
        
        // 🎯 最後のフレームでのみ、科学的分析完了として結果を表示
        if (index === animationFrames.length - 1) {
          // 🕒 分析完了まで1.2秒待つ
          setTimeout(() => {
            const finalMixed = mixMultipleColors(colors);
            setMixedColor(mixerIndex, finalMixed);
            
            // 教育的混合結果を生成
            const equalRatio = colors.map(() => 1 / colors.length);
            const educationalMixed = createEducationalMixingResult(
              colors, 
              finalMixed, 
              equalRatio
            );
            setEducationalResult(mixerIndex, educationalMixed);
            
            // 親コンポーネントに通知
            onColorMixed(finalMixed);
            if (onEducationalMixingResult) {
              onEducationalMixingResult(educationalMixed);
            }
            
            // 📊 分析結果表示後にアニメーション状態を終了
            setTimeout(() => {
              setIsAnimatingMixer(prev => ({ ...prev, [mixerIndex]: false }));
            }, 600); // 0.6秒後にアニメーション状態終了
          }, 1200); // 1.2秒の分析遅延
        }
      }, cumulativeDelay);
    });
  }, [setMixedColor, setEducationalResult, onColorMixed, onEducationalMixingResult, setMixingAnimation, setCurrentAnimationFrame]);

  // 🔧 混合処理を実行（アニメーション対応版）
  const performMixing = useCallback((colorsToMix: ColorInfo[], mixerIndex: number) => {
    if (colorsToMix.length < 2 || processingRef.current) return;
    
    const colorKey = `mixer-${mixerIndex}-${colorsToMix.map(c => c.hex).sort().join('-')}`;
    if (lastMixedRef.current === colorKey) return;
    
    processingRef.current = true;
    setIsAnimating(true);
    lastMixedRef.current = colorKey;
    
    // 🎨 段階的アニメーションを開始
    setTimeout(() => {
      startMixingAnimation(colorsToMix, mixerIndex);
      setTimeout(() => {
        setIsAnimating(false);
        processingRef.current = false;
      }, 100);
    }, 200);
  }, [startMixingAnimation]);

  // 🔧 色を混ぜる処理（ミキサー指定）
  const handleColorMix = useCallback((color: ColorInfo, mixerIndex: number) => {
    const currentMixingColors = getMixingColors(mixerIndex);
    const isDuplicate = currentMixingColors.some(c => c.hex === color.hex);
    if (isDuplicate || currentMixingColors.length >= 3) {
      return;
    }

    const newMixingColors = [...currentMixingColors, color];
    setMixingColors(mixerIndex, newMixingColors);
    
    setSparkleEffect(`mix-${color.hex}`);
    setTimeout(() => setSparkleEffect(null), 1000);
    
    if ('vibrate' in navigator) {
      navigator.vibrate([100, 50, 100]);
    }
    
    if (newMixingColors.length >= 2) {
      setTimeout(() => performMixing(newMixingColors, mixerIndex), 100);
    }
  }, [getMixingColors, setMixingColors, performMixing]);

  // 🎨 混色結果を抽出色に追加
  const handleAddMixedToExtracted = useCallback((mixerIndex: number) => {
    const mixedColor = getMixedColor(mixerIndex);
    if (!mixedColor || !onColorExtracted) return;
    
    // MixedColorをColorInfoに変換
    const colorInfo: ColorInfo = {
      hex: mixedColor.hex,
      rgb: mixedColor.rgb,
      hsl: mixedColor.hsl,
      name: mixedColor.name,
      id: mixedColor.id,
    };
    
    onColorExtracted(colorInfo);
    setSparkleEffect(`extracted-${colorInfo.hex}`);
    setTimeout(() => setSparkleEffect(null), 1000);
  }, [getMixedColor, onColorExtracted]);

  // ドラッグ開始
  const handleDragStart = useCallback((e: React.DragEvent, color: ColorInfo) => {
    e.dataTransfer.setData('application/json', JSON.stringify(color));
    e.dataTransfer.effectAllowed = 'copy';
  }, []);

  // 🎨 混色結果をドラッグ開始
  const handleMixedColorDragStart = useCallback((e: React.DragEvent, mixerIndex: number) => {
    const mixedColor = getMixedColor(mixerIndex);
    if (!mixedColor) return;
    
    // MixedColorをColorInfoに変換
    const colorInfo: ColorInfo = {
      hex: mixedColor.hex,
      rgb: mixedColor.rgb,
      hsl: mixedColor.hsl,
      name: mixedColor.name,
      id: mixedColor.id,
    };
    
    e.dataTransfer.setData('application/json', JSON.stringify(colorInfo));
    e.dataTransfer.effectAllowed = 'copy';
  }, [getMixedColor]);

  // タッチ操作（スマホ対応）
  const handleTouchStart = useCallback((e: React.TouchEvent, color: ColorInfo) => {
    e.preventDefault();
    setTouchingColor(color);
    
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    const touch = e.touches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    
    // 3つのミキサーのいずれかに含まれているかチェック
    for (let i = 1; i <= 3; i++) {
      const mixerRef = getMixerRef(i);
      if (element && mixerRef.current?.contains(element)) {
        setDragOverMixer(i);
        return;
      }
    }
    setDragOverMixer(null);
  }, [getMixerRef]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    if (!touchingColor || !dragOverMixer) return;
    
    handleColorMix(touchingColor, dragOverMixer);
    
    setTouchingColor(null);
    setDragOverMixer(null);
  }, [touchingColor, dragOverMixer, handleColorMix]);

  // ドロップエリア操作
  const handleDragOver = useCallback((e: React.DragEvent, mixerIndex: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setDragOverMixer(mixerIndex);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOverMixer(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, mixerIndex: number) => {
    e.preventDefault();
    setDragOverMixer(null);
    
    try {
      const colorData = e.dataTransfer.getData('application/json');
      const color = JSON.parse(colorData) as ColorInfo;
      handleColorMix(color, mixerIndex);
    } catch (error) {
      console.error('Color drop failed:', error);
    }
  }, [handleColorMix]);

  // 🎨 抽出色エリアのドロップ処理
  const handleExtractedDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setDragOverExtracted(true);
  }, []);

  const handleExtractedDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOverExtracted(false);
  }, []);

  const handleExtractedDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOverExtracted(false);
    
    if (!onColorExtracted) return;
    
    try {
      const colorData = e.dataTransfer.getData('application/json');
      const color = JSON.parse(colorData) as ColorInfo;
      onColorExtracted(color);
      setSparkleEffect(`extracted-${color.hex}`);
      setTimeout(() => setSparkleEffect(null), 1000);
    } catch (error) {
      console.error('Color drop to extracted failed:', error);
    }
  }, [onColorExtracted]);

  // 🔧 ミキサーをクリア（アニメーション状態もリセット）
  const handleClearMixer = useCallback((mixerIndex: number) => {
    setMixingColors(mixerIndex, []);
    setMixedColor(mixerIndex, null);
    setEducationalResult(mixerIndex, null);
    setMixingAnimation(mixerIndex, []);
    setCurrentAnimationFrame(mixerIndex, 0);
    setIsAnimatingMixer(prev => ({ ...prev, [mixerIndex]: false }));
    lastMixedRef.current = '';
  }, [setMixingColors, setMixedColor, setEducationalResult, setMixingAnimation, setCurrentAnimationFrame]);

  // 🔧 混ぜる色を個別削除（ミキサー指定）
  const handleRemoveMixingColor = useCallback((colorToRemove: ColorInfo, mixerIndex: number) => {
    const currentColors = getMixingColors(mixerIndex);
    const newColors = currentColors.filter(c => c.hex !== colorToRemove.hex);
    setMixingColors(mixerIndex, newColors);
    
    if (newColors.length >= 2) {
      setTimeout(() => performMixing(newColors, mixerIndex), 100);
    } else {
      setMixedColor(mixerIndex, null);
      setEducationalResult(mixerIndex, null);
      lastMixedRef.current = '';
    }
  }, [getMixingColors, setMixingColors, performMixing, setMixedColor, setEducationalResult]);

  // 🔧 混合結果をコピー（ミキサー指定）
  const handleCopyMixed = useCallback(async (mixerIndex: number) => {
    const mixedColor = getMixedColor(mixerIndex);
    if (!mixedColor) return;
    
    await copyToClipboard(mixedColor.hex);
    
    setSparkleEffect(`mixed-copy-${mixerIndex}`);
    setTimeout(() => setSparkleEffect(null), 800);
  }, [getMixedColor]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-2xl border-4 border-indigo-300">
      {/* 🎓 ヘッダー - シンプル表示 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <div className="p-2 bg-gradient-to-r from-indigo-400 to-purple-500 rounded-full mr-3">
            <Palette className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
              🧪 科学的マルチミキサー
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              3つのミキサーで混色の科学を探求！全機能開放モード
            </p>
          </div>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* 🎨 色選択エリア */}
        <div className="xl:col-span-1">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-bold text-gray-700 dark:text-gray-300">
              🌈 色を選択してください
            </h3>
            <div className="flex items-center space-x-2 text-xs text-gray-500">
              <span>👆 クリック=詳細</span>
              <span>🎯 ドラッグ=混合</span>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-3">
            {colors.map((color, index) => {
              const hasSparkle = sparkleEffect === `copy-${color.hex}`;
              const educationalColor = enhanceColorWithEducationalInfo(color);
              
              return (
                <div
                  key={color.id || `${color.hex}-${index}`}
                  className={`relative group aspect-square rounded-xl cursor-pointer transform transition-all duration-300 hover:scale-105 shadow-lg border-2 border-white select-none ${
                    hasSparkle ? 'animate-pulse ring-4 ring-yellow-400' : ''
                  } ${
                    selectedColor?.hex === color.hex ? 'ring-2 ring-indigo-400' : ''
                  } ${
                    touchingColor?.hex === color.hex ? 'scale-105 ring-2 ring-blue-400' : ''
                  }`}
                  style={{ backgroundColor: color.hex }}
                  draggable
                  onClick={() => handleColorClick(color)}
                  onDragStart={(e) => handleDragStart(e, color)}
                  onTouchStart={(e) => handleTouchStart(e, color)}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                  title={`${color.name} - クリック:詳細, ドラッグ:混合`}
                >
                  {/* キラキラエフェクト */}
                  {hasSparkle && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Sparkles className="h-6 w-6 text-yellow-300 animate-spin" />
                    </div>
                  )}
                  
                  {/* 🎓 科学的情報（常に表示） */}
                  <div className="absolute top-1 left-1 bg-white bg-opacity-90 rounded-full p-1">
                    <div className="text-xs font-bold text-gray-800">
                      {educationalColor.wheelPosition.angle}°
                    </div>
                  </div>
                  
                  {/* コピーアイコン */}
                  <div className="absolute top-1 right-1 bg-white bg-opacity-80 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Copy className="h-3 w-3 text-gray-600" />
                  </div>
                  
                  {/* 色の名前 */}
                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 rounded-b-xl text-center">
                    {color.name}
                  </div>
                </div>
              );
            })}
          </div>

          {/* 🎨 スポイト抽出色エリア */}
          {(extractedColors.length > 0 || onColorExtracted) && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-bold text-gray-700 dark:text-gray-300">
                  🔬 抽出色パレット
                </h3>
                {extractedColors.length > 0 && onColorRemoved && (
                  <button
                    onClick={() => {
                      // すべての抽出色を削除
                      extractedColors.forEach((color) => {
                        onColorRemoved(color);
                      });
                    }}
                    className="px-2 py-1 bg-red-400 hover:bg-red-500 text-white text-xs rounded-full transition-colors cursor-pointer"
                    title="すべての抽出色を削除"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                )}
              </div>

              {extractedColors.length > 0 ? (
                <div
                  className="relative"
                  onDragOver={handleExtractedDragOver}
                  onDragLeave={handleExtractedDragLeave}
                  onDrop={handleExtractedDrop}
                >
                  <div className="bg-gray-50 dark:bg-gray-700/30 rounded-2xl p-4 relative transition-all duration-300">
                    <div className="grid grid-cols-4 gap-3">
                      {extractedColors.map((color, index) => {
                        const hasSparkle = sparkleEffect === `extracted-${color.hex}`;
                        return (
                          <div
                            key={`extracted-${color.hex}-${index}`}
                            className="group relative"
                          >
                            <div
                              className={`aspect-square rounded-xl cursor-pointer transform transition-all duration-300 hover:scale-105 shadow-lg border-2 border-white select-none ${
                                hasSparkle ? 'animate-pulse ring-4 ring-green-400' : ''
                              }`}
                              style={{ backgroundColor: color.hex }}
                              draggable
                              onClick={() => handleColorClick(color)}
                              onDragStart={(e) => handleDragStart(e, color)}
                              title={`${color.name} - ドラッグしてミキサーに追加`}
                            >
                              {/* キラキラエフェクト */}
                              {hasSparkle && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <Sparkles className="h-4 w-4 text-green-300 animate-spin" />
                                </div>
                              )}
                              
                              {/* 削除ボタン */}
                              {onColorRemoved && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onColorRemoved(color);
                                  }}
                                  className="absolute -top-1 -right-1 bg-red-400 hover:bg-red-500 text-white rounded-full w-4 h-4 text-xs opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer flex items-center justify-center"
                                  title="削除"
                                >
                                  <Trash2 className="h-2 w-2" />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* ドロップオーバーインジケーター */}
                  {dragOverExtracted && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-green-100 dark:bg-green-900/30 border-2 border-green-400 z-10">
                      <div className="text-center animate-pulse bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-lg border-2 border-green-400">
                        <div className="text-2xl mb-2 animate-bounce">✨</div>
                        <p className="text-sm font-bold text-green-800 dark:text-green-300">
                          抽出色に追加します！
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ) : onColorExtracted && (
                <div
                  className={`p-4 text-center bg-gray-50 dark:bg-gray-700/30 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-600 transition-all duration-500 ${
                    dragOverExtracted
                      ? 'ring-4 ring-green-400 scale-105 shadow-2xl bg-green-100 dark:bg-green-900/30 border-green-400'
                      : 'hover:shadow-lg'
                  }`}
                  onDragOver={handleExtractedDragOver}
                  onDragLeave={handleExtractedDragLeave}
                  onDrop={handleExtractedDrop}
                >
                  <div
                    className={`text-2xl mb-3 transition-all duration-300 ${
                      dragOverExtracted
                        ? 'animate-bounce scale-110'
                        : 'animate-pulse'
                    }`}
                  >
                    🔬
                  </div>
                  <p className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                    抽出色パレット
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    混色結果をここにドラッグして保存
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 🪄 3つの混合エリア */}
        <div className="xl:col-span-2">
          <h3 className="text-lg font-bold mb-3 text-gray-700 dark:text-gray-300">
            🪄 科学的マルチミキサー
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((mixerIndex) => {
              const mixingColors = getMixingColors(mixerIndex);
              const mixedColor = getMixedColor(mixerIndex);
              const educationalResult = getEducationalResult(mixerIndex);
              const mixerRef = getMixerRef(mixerIndex);

              return (
                <div key={`mixer-${mixerIndex}`} className="bg-gray-50 dark:bg-gray-700/30 rounded-2xl p-4">
                  <h4 className="text-sm font-bold mb-2 text-center text-gray-700 dark:text-gray-300">
                    🧪 ミキサー {mixerIndex}
                  </h4>
                  
                  {/* 混合エリア */}
                  <div
                    ref={mixerRef}
                    className={`h-32 border-2 border-dashed rounded-xl p-2 text-center transition-all duration-300 mb-3 ${
                      dragOverMixer === mixerIndex
                        ? 'border-indigo-400 bg-indigo-100 dark:bg-indigo-900/30 scale-105' 
                        : 'border-gray-300 dark:border-gray-600'
                    } ${isAnimating ? 'animate-pulse' : ''}`}
                    onDragOver={(e) => handleDragOver(e, mixerIndex)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, mixerIndex)}
                  >
                    {isAnimatingMixer[mixerIndex] ? (
                      // 🎨 科学的色彩混合分析中の表示
                      <div className="h-full flex flex-col justify-center items-center relative overflow-hidden">
                        {/* メインの色変化表示 */}
                        <div
                          className="w-16 h-16 rounded-xl transition-all duration-200 border-2 border-white shadow-lg relative"
                          style={{
                            backgroundColor: getMixingAnimation(mixerIndex)[getCurrentAnimationFrame(mixerIndex)]?.hex || '#f0f0f0',
                          }}
                        >
                          {/* 🔬 科学的分析エフェクト */}
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="bg-white/95 backdrop-blur-sm rounded-lg p-2 shadow-lg">
                              <div className="flex items-center space-x-1">
                                <Atom className="h-3 w-3 text-indigo-600 animate-spin" />
                                <Settings className="h-2 w-2 text-gray-500 animate-pulse" />
                              </div>
                            </div>
                          </div>

                          {/* 分析進行度インジケーター */}
                          <div className="absolute -bottom-2 left-0 right-0 px-1">
                            <div className="bg-white/80 rounded-full h-1 overflow-hidden">
                              <div 
                                className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full transition-all duration-300"
                                style={{
                                  width: `${(getCurrentAnimationFrame(mixerIndex) / Math.max(1, getMixingAnimation(mixerIndex).length - 1)) * 100}%`
                                }}
                              />
                            </div>
                          </div>
                        </div>

                        {/* 📊 科学的分析メッセージ */}
                        <div className="mt-2 text-center">
                          <p className="text-xs font-medium text-indigo-700 dark:text-indigo-300 animate-pulse">
                            色彩混合を分析中...
                          </p>
                          <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
                            Color mixing analysis
                          </p>
                        </div>

                        {/* ✨ 科学的エフェクト（分子っぽい動き） */}
                        <div className="absolute inset-0">
                          {[...Array(3)].map((_, i) => (
                            <div
                              key={i}
                              className="absolute w-1 h-1 bg-indigo-400 rounded-full opacity-60 animate-ping"
                              style={{
                                left: `${25 + (i * 25) + (Math.sin(getCurrentAnimationFrame(mixerIndex) * 0.15 + i * 2) * 15)}%`,
                                top: `${30 + (i * 10) + (Math.cos(getCurrentAnimationFrame(mixerIndex) * 0.15 + i * 2) * 20)}%`,
                                animationDelay: `${i * 300}ms`,
                                animationDuration: '1.5s'
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    ) : mixingColors.length > 0 ? (
                      <div className="h-full flex flex-col justify-between">
                        <div className="flex-1 flex items-center justify-center">
                          <div className="flex items-center space-x-1">
                            {mixingColors.map((color, index) => (
                              <div key={`mixing-${mixerIndex}-${color.hex}-${index}`} className="relative group">
                                <div
                                  className="w-6 h-6 rounded-full border border-white shadow-sm"
                                  style={{ backgroundColor: color.hex }}
                                  title={color.name}
                                />
                                <button
                                  onClick={() => handleRemoveMixingColor(color, mixerIndex)}
                                  className="absolute -top-1 -right-1 bg-red-400 hover:bg-red-500 text-white rounded-full w-3 h-3 text-xs opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer flex items-center justify-center"
                                  title="削除"
                                >
                                  <Trash2 className="h-2 w-2" />
                                </button>
                                {index < mixingColors.length - 1 && (
                                  <div className="absolute top-1/2 -right-2 text-xs">+</div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        <button
                          onClick={() => handleClearMixer(mixerIndex)}
                          className="px-2 py-1 bg-gray-400 hover:bg-gray-500 text-white text-xs rounded-full transition-colors cursor-pointer"
                        >
                          クリア
                        </button>
                      </div>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center">
                        <div className="text-2xl mb-1">🎨</div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          色をドラッグ
                        </p>
                      </div>
                    )}
                  </div>

                  {/* 結果表示 */}
                  {mixedColor ? (
                    <div className="text-center">
                      <div
                        className="w-12 h-12 mx-auto rounded-full border-2 border-white shadow-md cursor-pointer hover:scale-110 transition-transform mb-2 group relative"
                        style={{ backgroundColor: mixedColor.hex }}
                        draggable // 🎨 混色結果をドラッグ可能にする
                        onClick={() => handleCopyMixed(mixerIndex)}
                        onDragStart={(e) => handleMixedColorDragStart(e, mixerIndex)}
                        title={`${mixedColor.name} (${mixedColor.hex}) - クリック:コピー, ドラッグ:移動`}
                      >
                        {sparkleEffect === `mixed-copy-${mixerIndex}` && (
                          <div className="w-full h-full flex items-center justify-center">
                            <Sparkles className="h-4 w-4 text-yellow-300 animate-spin" />
                          </div>
                        )}
                        
                        {/* ドラッグヒント */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <div className="bg-white bg-opacity-80 rounded-full p-1">
                            <div className="text-gray-600 text-lg">↗</div>
                          </div>
                        </div>
                      </div>
                      <p className="text-xs font-bold text-gray-800 dark:text-white">
                        {mixedColor.name}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                        {mixedColor.hex}
                      </p>

                      {/* 🎨 抽出色に追加ボタン */}
                      {onColorExtracted && (
                        <button
                          onClick={() => handleAddMixedToExtracted(mixerIndex)}
                          className="px-2 py-1 bg-green-400 hover:bg-green-500 text-white text-xs rounded-full transition-colors cursor-pointer mb-2"
                          title="抽出色に追加"
                        >
                          抽出色に追加
                        </button>
                      )}

                      {/* 🎓 教育的情報（コンパクト） */}
                      {educationalResult && showExplanations && (
                        <div className="mt-2 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-2 text-xs">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-indigo-800 dark:text-indigo-300">
                              📚 {educationalResult.theory.title}
                            </span>
                            <span className={`px-1 py-0.5 rounded text-xs text-white ${
                              educationalResult.mixingType === 'additive' ? 'bg-green-500' : 'bg-blue-500'
                            }`}>
                              {educationalResult.mixingType === 'additive' ? '加法' : '減法'}
                            </span>
                          </div>
                          <p className="text-gray-700 dark:text-gray-300 leading-tight">
                            {educationalResult.scientificExplanation.slice(0, 80)}...
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center text-gray-500 dark:text-gray-400">
                      <div className="text-xl mb-1">🔬</div>
                      <p className="text-xs">混色を待機中</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 🎓 詳細な色情報表示（選択された色） - 常に表示 */}
      {selectedColor && (
        <div className="mt-6 bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/30 dark:to-blue-900/30 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-bold text-indigo-800 dark:text-indigo-300">
              🔍 色の科学的情報: {selectedColor.name}
            </h3>
            <button
              onClick={() => setSelectedColor(null)}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 cursor-pointer"
            >
              ✕
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            {/* 色相環情報 */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-3">
              <div className="flex items-center mb-2">
                <RotateCcw className="h-4 w-4 text-blue-500 mr-2" />
                <span className="font-bold">色相環</span>
              </div>
              <p>角度: <strong>{selectedColor.wheelPosition.angle}°</strong></p>
              <p>位置: <strong>{getColorNameFromAngle(selectedColor.wheelPosition.angle)}</strong></p>
              <p>彩度: <strong>{selectedColor.wheelPosition.radius}%</strong></p>
            </div>
            
            {/* 波長情報 */}
            {selectedColor.science.wavelength && (
              <div className="bg-white dark:bg-gray-800 rounded-xl p-3">
                <div className="flex items-center mb-2">
                  <Eye className="h-4 w-4 text-green-500 mr-2" />
                  <span className="font-bold">波長</span>
                </div>
                <p>波長: <strong>{Math.round(selectedColor.science.wavelength)}nm</strong></p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  {getWavelengthDescription(selectedColor.science.wavelength)}
                </p>
              </div>
            )}
            
            {/* 心理効果 */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-3">
              <div className="flex items-center mb-2">
                <Lightbulb className="h-4 w-4 text-yellow-500 mr-2" />
                <span className="font-bold">心理効果</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {selectedColor.psychologyEffects.slice(0, 3).map((effect, index) => (
                  <span key={index} className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 text-xs rounded-full">
                    {effect}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 💡 学習ヒント */}
      <div className="mt-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-3">
        <div className="flex justify-center space-x-6 text-sm">
          <div className="text-center">
            <div className="text-lg mb-1">👆</div>
            <span className="font-medium text-gray-700 dark:text-gray-300">クリック=色の詳細</span>
          </div>
          <div className="text-center">
            <div className="text-lg mb-1">🎯</div>
            <span className="font-medium text-gray-700 dark:text-gray-300">ドラッグ=科学的混色</span>
          </div>
          <div className="text-center">
            <div className="text-lg mb-1">🧪</div>
            <span className="font-medium text-gray-700 dark:text-gray-300">3ミキサー=高次混色</span>
          </div>
          <div className="text-center">
            <div className="text-lg mb-1">🔬</div>
            <span className="font-medium text-gray-700 dark:text-gray-300">抽出色=パレット管理</span>
          </div>
          <div className="text-center">
            <div className="text-lg mb-1">🎓</div>
            <span className="font-medium text-gray-700 dark:text-gray-300">結果=理論説明</span>
          </div>
        </div>
      </div>
    </div>
  );
}
