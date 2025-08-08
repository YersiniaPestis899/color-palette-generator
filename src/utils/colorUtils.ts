import chroma from 'chroma-js';
import { ColorInfo, MixedColor } from '../types/color';

/**
 * 🎨 **最適化されたカラーユーティリティ**
 * 
 * 未使用関数を削除し、実際に使用される機能のみを残しました
 */

/**
 * RGB値をHEXに変換
 */
export function rgbToHex(r: number, g: number, b: number): string {
  return chroma(r, g, b).hex();
}

/**
 * HEX値をRGBに変換
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const color = chroma(hex);
  const [r, g, b] = color.rgb();
  return { r: Math.round(r), g: Math.round(g), b: Math.round(b) };
}

/**
 * RGB値をHSLに変換
 */
export function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  const color = chroma(r, g, b);
  const [h, s, l] = color.hsl();
  return { 
    h: Math.round(h || 0), 
    s: Math.round(s * 100), 
    l: Math.round(l * 100) 
  };
}

/**
 * RGB値からColorInfoオブジェクトを作成
 */
export function createColorInfo(r: number, g: number, b: number, id?: string): ColorInfo {
  const hex = rgbToHex(r, g, b);
  const rgb = { r, g, b };
  const hsl = rgbToHsl(r, g, b);
  const name = getColorName(hex);
  
  return { hex, rgb, hsl, name, id: id || generateColorId() };
}

/**
 * カラーIDを生成
 */
export function generateColorId(): string {
  return 'color_' + Math.random().toString(36).substr(2, 9);
}

/**
 * 2つの色を混合する
 * 
 * @example
 * const mixed = mixColors(redColor, blueColor, 0.5);
 */
export function mixColors(color1: ColorInfo, color2: ColorInfo, ratio: number = 0.5): MixedColor {
  const mixed = chroma.mix(color1.hex, color2.hex, ratio);
  const [r, g, b] = mixed.rgb();
  
  const mixedColorInfo = createColorInfo(Math.round(r), Math.round(g), Math.round(b));
  
  return {
    ...mixedColorInfo,
    parentColors: [color1.id!, color2.id!],
    ratio: [1 - ratio, ratio],
    name: `${color1.name} × ${color2.name}`
  };
}

/**
 * 複数の色を混合する（3色以上対応）
 * 
 * @example
 * const mixed = mixMultipleColors([redColor, greenColor, blueColor]);
 */
export function mixMultipleColors(colors: ColorInfo[]): MixedColor {
  if (colors.length < 2) {
    throw new Error('2色以上の色が必要です');
  }
  
  if (colors.length === 2) {
    return mixColors(colors[0], colors[1]);
  }
  
  // 複数色を順番に混合
  let currentMix = colors[0].hex;
  
  for (let i = 1; i < colors.length; i++) {
    currentMix = chroma.mix(currentMix, colors[i].hex, 1 / (i + 1)).hex();
  }
  
  const [r, g, b] = chroma(currentMix).rgb();
  const mixedColorInfo = createColorInfo(Math.round(r), Math.round(g), Math.round(b));
  
  // すべての親色のIDを記録
  const parentIds = colors.map(c => c.id!);
  const colorNames = colors.map(c => c.name).join(' × ');
  
  return {
    ...mixedColorInfo,
    parentColors: parentIds,
    ratio: colors.map(() => 1 / colors.length), // 均等な比率
    name: `混合色: ${colorNames}`
  };
}

/**
 * ランダムな色を生成
 */
export function generateRandomColor(): ColorInfo {
  const r = Math.floor(Math.random() * 256);
  const g = Math.floor(Math.random() * 256);
  const b = Math.floor(Math.random() * 256);
  return createColorInfo(r, g, b);
}

/**
 * 色の距離を計算（Delta E 2000）
 */
export function getColorDistance(color1: string, color2: string): number {
  return chroma.deltaE(color1, color2);
}

/**
 * 色の温度を取得（暖色/寒色の判定）
 */
export function getColorTemperature(hex: string): 'warm' | 'cool' | 'neutral' {
  const hsl = chroma(hex).hsl();
  const hue = hsl[0] || 0;
  
  if (hue >= 45 && hue <= 135) return 'cool'; // 青〜緑
  if (hue >= 225 && hue <= 315) return 'cool'; // 青〜紫
  if ((hue >= 315 && hue <= 360) || (hue >= 0 && hue <= 45)) return 'warm'; // 赤〜オレンジ
  if (hue >= 135 && hue <= 225) return 'warm'; // 黄〜オレンジ
  
  return 'neutral';
}

/**
 * 色の名前を取得（簡易版）
 */
export function getColorName(hex: string): string {
  const colorNames: { [key: string]: string } = {
    '#FF0000': 'レッド',
    '#00FF00': 'グリーン',
    '#0000FF': 'ブルー',
    '#FFFF00': 'イエロー',
    '#FF00FF': 'マゼンタ',
    '#00FFFF': 'シアン',
    '#000000': 'ブラック',
    '#FFFFFF': 'ホワイト',
    '#808080': 'グレー',
    '#FFA500': 'オレンジ',
    '#800080': 'パープル',
    '#FFC0CB': 'ピンク',
    '#A52A2A': 'ブラウン',
    '#008000': 'ダークグリーン',
    '#000080': 'ネイビー',
  };

  // 完全一致をチェック
  if (colorNames[hex.toUpperCase()]) {
    return colorNames[hex.toUpperCase()];
  }

  // 近似色を検索
  const color = chroma(hex);
  const hsl = color.hsl();
  const h = hsl[0] || 0;
  const s = hsl[1] || 0;
  const l = hsl[2] || 0;

  if (s < 0.1) {
    if (l < 0.2) return 'ダークグレー';
    if (l < 0.5) return 'グレー';
    if (l < 0.8) return 'ライトグレー';
    return 'ホワイト';
  }

  if (l < 0.15) return 'ダーク';
  if (l > 0.85) return 'ライト';

  if (h < 15 || h > 345) return 'レッド系';
  if (h < 45) return 'オレンジ系';
  if (h < 75) return 'イエロー系';
  if (h < 150) return 'グリーン系';
  if (h < 180) return 'シアン系';
  if (h < 250) return 'ブルー系';
  if (h < 290) return 'パープル系';
  if (h < 345) return 'ピンク系';

  return 'カスタム';
}

/**
 * 色のコントラスト比を計算
 */
export function getContrastRatio(color1: string, color2: string): number {
  return chroma.contrast(color1, color2);
}

/**
 * 色が明るいかどうかを判定
 */
export function isLightColor(hex: string): boolean {
  return chroma(hex).luminance() > 0.5;
}

/**
 * 色を明るくする
 */
export function lightenColor(hex: string, amount: number): string {
  return chroma(hex).brighten(amount).hex();
}

/**
 * 色を暗くする
 */
export function darkenColor(hex: string, amount: number): string {
  return chroma(hex).darken(amount).hex();
}

/**
 * 補色を取得
 */
export function getComplementaryColor(hex: string): string {
  const hsl = chroma(hex).hsl();
  const complementaryHue = ((hsl[0] || 0) + 180) % 360;
  return chroma.hsl(complementaryHue, hsl[1], hsl[2]).hex();
}

/**
 * カラーパレットをCSS形式でエクスポート
 * 
 * @example
 * const css = exportToCss(colors, 'ブランドカラー');
 * // :root { --color-1: #FF0000; --color-2: #00FF00; }
 */
export function exportToCss(colors: ColorInfo[], paletteName: string): string {
  const cssVars = colors.map((color, index) => 
    `  --color-${index + 1}: ${color.hex};`
  ).join('\n');
  
  return `:root {\n${cssVars}\n}\n\n/* ${paletteName} */`;
}

/**
 * カラーパレットをJSON形式でエクスポート
 */
export function exportToJson(colors: ColorInfo[], paletteName: string): string {
  const palette = {
    name: paletteName,
    colors: colors.map(color => ({
      hex: color.hex,
      rgb: color.rgb,
      hsl: color.hsl,
      name: color.name
    }))
  };
  
  return JSON.stringify(palette, null, 2);
}

/**
 * クリップボードにコピー
 */
/**
 * 🎨 色混合アニメーション用のユーティリティ関数
 */

/**
 * 段階的な色変化のキーフレームを生成
 * 手作業感のあるムラを表現するため、ランダムな変化を含む
 * 
 * @example
 * const frames = generateColorMixingAnimation([redColor, blueColor], 30);
 * // 赤から紫への30段階の変化を生成
 */
export function generateColorMixingAnimation(
  colors: ColorInfo[], 
  steps: number = 30
): { hex: string; progress: number }[] {
  if (colors.length < 2) {
    return [{ hex: colors[0]?.hex || '#000000', progress: 1 }];
  }

  const frames: { hex: string; progress: number }[] = [];
  
  // 各ステップでの色を計算
  for (let i = 0; i <= steps; i++) {
    const progress = i / steps;
    
    // 手作業感を出すためのムラを追加
    // 進行度にランダムな変動を加える（±10%程度）
    const jitter = (Math.random() - 0.5) * 0.1;
    const adjustedProgress = Math.max(0, Math.min(1, progress + jitter));
    
    let mixedColor: string;
    
    if (colors.length === 2) {
      // 2色の場合：シンプルな補間
      mixedColor = chroma.mix(colors[0].hex, colors[1].hex, adjustedProgress).hex();
    } else {
      // 3色以上の場合：段階的な混合
      mixedColor = getMixedColorAtProgress(colors, adjustedProgress);
    }
    
    frames.push({
      hex: mixedColor,
      progress: progress
    });
  }
  
  return frames;
}

/**
 * 複数色の段階的混合を計算
 * 進行度に応じて色を段階的に追加していく
 */
function getMixedColorAtProgress(colors: ColorInfo[], progress: number): string {
  if (progress <= 0) return colors[0].hex;
  if (progress >= 1) {
    // 最終的にすべての色を混合
    let result = colors[0].hex;
    for (let i = 1; i < colors.length; i++) {
      result = chroma.mix(result, colors[i].hex, 1 / (i + 1)).hex();
    }
    return result;
  }
  
  // 進行度に基づいて色を段階的に追加
  const totalColors = colors.length;
  const currentStage = progress * (totalColors - 1);
  const stageIndex = Math.floor(currentStage);
  const stageProgress = currentStage - stageIndex;
  
  if (stageIndex === 0) {
    // 1色目から2色目への変化
    return chroma.mix(colors[0].hex, colors[1].hex, stageProgress).hex();
  }
  
  // すでにstageIndex個の色が混ざっている状態に、次の色を追加
  let currentMix = colors[0].hex;
  for (let i = 1; i <= stageIndex; i++) {
    currentMix = chroma.mix(currentMix, colors[i].hex, 1 / (i + 1)).hex();
  }
  
  // 次の色を段階的に追加
  if (stageIndex + 1 < colors.length) {
    const nextColorWeight = stageProgress / (stageIndex + 2);
    currentMix = chroma.mix(currentMix, colors[stageIndex + 1].hex, nextColorWeight).hex();
  }
  
  return currentMix;
}

/**
 * ムラのあるエフェクト用のランダム色バリエーション
 * 手作業感を演出するため、微細な色の揺らぎを生成
 */
export function addColorJitter(hex: string, intensity: number = 0.05): string {
  const color = chroma(hex);
  const [h, s, l] = color.hsl();
  
  // 色相、彩度、明度にわずかな変動を加える
  const newH = (h + (Math.random() - 0.5) * intensity * 360) % 360;
  const newS = Math.max(0, Math.min(1, s + (Math.random() - 0.5) * intensity));
  const newL = Math.max(0, Math.min(1, l + (Math.random() - 0.5) * intensity));
  
  return chroma.hsl(newH || 0, newS, newL).hex();
}

/**
 * 混合アニメーション用の遅延時間を計算
 * より自然な手作業感を演出
 */
export function calculateAnimationDelay(stepIndex: number, totalSteps: number): number {
  // 基本遅延時間（ミリ秒）
  const baseDelay = 50;
  
  // 初期は早く、後半は少し遅くなる自然なカーブ
  const curve = 1 - Math.pow(stepIndex / totalSteps, 0.7);
  const randomJitter = (Math.random() - 0.5) * 20; // ±10ms のランダム性
  
  return Math.max(10, baseDelay * curve + randomJitter);
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('クリップボードへのコピーに失敗しました:', err);
    return false;
  }
}
