import ColorThief from 'colorthief';
import { ColorInfo } from '../types/color';
import { createColorInfo } from './colorUtils';

/**
 * 画像から主要な色を抽出
 */
export async function extractColorsFromImage(
  imageElement: HTMLImageElement,
  colorCount: number = 5
): Promise<ColorInfo[]> {
  return new Promise((resolve, reject) => {
    try {
      const colorThief = new ColorThief();
      
      // 画像が読み込まれていない場合は読み込み完了を待つ
      if (!imageElement.complete) {
        imageElement.onload = () => {
          extractColors();
        };
        imageElement.onerror = () => {
          reject(new Error('画像の読み込みに失敗しました'));
        };
      } else {
        extractColors();
      }
      
      function extractColors() {
        try {
          const palette = colorThief.getPalette(imageElement, colorCount);
          const colors = palette.map(([r, g, b]: [number, number, number], index: number) => 
            createColorInfo(r, g, b, `extracted_${Date.now()}_${index}`)
          );
          resolve(colors);
        } catch (error) {
          reject(new Error('色の抽出に失敗しました'));
        }
      }
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * 画像から最も支配的な色を抽出
 */
export async function extractDominantColor(
  imageElement: HTMLImageElement
): Promise<ColorInfo> {
  return new Promise((resolve, reject) => {
    try {
      const colorThief = new ColorThief();
      
      if (!imageElement.complete) {
        imageElement.onload = () => {
          extractColor();
        };
        imageElement.onerror = () => {
          reject(new Error('画像の読み込みに失敗しました'));
        };
      } else {
        extractColor();
      }
      
      function extractColor() {
        try {
          const [r, g, b] = colorThief.getColor(imageElement);
          const color = createColorInfo(r, g, b, `dominant_${Date.now()}`);
          resolve(color);
        } catch (error) {
          reject(new Error('支配的な色の抽出に失敗しました'));
        }
      }
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * File オブジェクトから画像要素を作成
 */
export function createImageElementFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        resolve(img);
      };
      
      img.onerror = () => {
        reject(new Error('画像の作成に失敗しました'));
      };
      
      img.src = e.target?.result as string;
    };
    
    reader.onerror = () => {
      reject(new Error('ファイルの読み込みに失敗しました'));
    };
    
    reader.readAsDataURL(file);
  });
}

/**
 * 画像ファイルの検証
 */
export function validateImageFile(file: File): { isValid: boolean; error?: string } {
  const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  const maxSize = 10 * 1024 * 1024; // 10MB
  
  if (!validTypes.includes(file.type)) {
    return {
      isValid: false,
      error: 'JPEG、PNG、GIF、WebPファイルのみサポートされています'
    };
  }
  
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: 'ファイルサイズは10MB以下にしてください'
    };
  }
  
  return { isValid: true };
}

/**
 * 画像からカラーパレットを生成（メイン関数）
 */
export async function generatePaletteFromImage(
  file: File,
  colorCount: number = 5
): Promise<{
  colors: ColorInfo[];
  imageUrl: string;
}> {
  // ファイル検証
  const validation = validateImageFile(file);
  if (!validation.isValid) {
    throw new Error(validation.error);
  }
  
  try {
    // 画像要素を作成
    const imageElement = await createImageElementFromFile(file);
    
    // 色を抽出
    const colors = await extractColorsFromImage(imageElement, colorCount);
    
    // 画像URLを作成
    const imageUrl = URL.createObjectURL(file);
    
    return {
      colors,
      imageUrl
    };
  } catch (error) {
    throw new Error(`カラーパレットの生成に失敗しました: ${error}`);
  }
}

/**
 * Canvas を使用してより精密な色抽出
 */
export function extractColorsFromCanvas(
  canvas: HTMLCanvasElement,
  colorCount: number = 5
): ColorInfo[] {
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas context の取得に失敗しました');
  }
  
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  
  // 色の頻度をカウント
  const colorMap = new Map<string, { count: number; r: number; g: number; b: number }>();
  
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const alpha = data[i + 3];
    
    // 透明度が低い場合はスキップ
    if (alpha < 128) continue;
    
    // 色を16進数に変換してキーとして使用
    const colorKey = `${r},${g},${b}`;
    
    if (colorMap.has(colorKey)) {
      colorMap.get(colorKey)!.count++;
    } else {
      colorMap.set(colorKey, { count: 1, r, g, b });
    }
  }
  
  // 頻度順でソート
  const sortedColors = Array.from(colorMap.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, colorCount);
  
  return sortedColors.map((color, index) => 
    createColorInfo(color.r, color.g, color.b, `canvas_${Date.now()}_${index}`)
  );
}

/**
 * 🎨 超高精度スポイト機能：画像上の指定位置の色を抽出
 */
export function extractColorFromImageAtPosition(
  imageElement: HTMLImageElement,
  x: number,
  y: number
): Promise<ColorInfo> {
  return new Promise((resolve, reject) => {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d', { 
        willReadFrequently: true,
        alpha: false // アルファチャンネルを無効化して高速化
      });
      
      if (!ctx) {
        reject(new Error('Canvas context の取得に失敗しました'));
        return;
      }
      
      // 🎯 キャンバスのサイズを画像と全く同じに設定
      canvas.width = imageElement.naturalWidth;
      canvas.height = imageElement.naturalHeight;
      
      // 🔍 高品質描画設定
      ctx.imageSmoothingEnabled = false; // 補間を無効化して正確な色を取得
      ctx.imageSmoothingQuality = 'high';
      
      // 画像をキャンバスに描画
      ctx.drawImage(imageElement, 0, 0);
      
      // 💎 極限精度色拽出：5x5ピクセルの重み付き平均を取る
      const sampleSize = 5; // 5x5グリッドでより精密に
      const halfSize = Math.floor(sampleSize / 2);
      const centerWeight = 3; // 中央ピクセルの重みを大きく
      
      let totalR = 0, totalG = 0, totalB = 0, totalWeight = 0;
      
      for (let dy = -halfSize; dy <= halfSize; dy++) {
        for (let dx = -halfSize; dx <= halfSize; dx++) {
          const sampleX = Math.max(0, Math.min(canvas.width - 1, x + dx));
          const sampleY = Math.max(0, Math.min(canvas.height - 1, y + dy));
          
          const imageData = ctx.getImageData(sampleX, sampleY, 1, 1);
          const data = imageData.data;
          
          if (data[3] > 0) { // アルファ値が0でないピクセルのみ使用
            // 中央からの距離によって重みを計算（中央ほど重く）
            const distance = Math.sqrt(dx * dx + dy * dy);
            const weight = dx === 0 && dy === 0 ? centerWeight : Math.max(1, centerWeight - distance);
            
            totalR += data[0] * weight;
            totalG += data[1] * weight;
            totalB += data[2] * weight;
            totalWeight += weight;
          }
        }
      }
      
      if (totalWeight === 0) {
        // 💎 フォールバック：中央ピクセルのみ使用（最高精度）
        const imageData = ctx.getImageData(x, y, 1, 1);
        const data = imageData.data;
        const r = data[0];
        const g = data[1];
        const b = data[2];
        const colorInfo = createColorInfo(r, g, b, `eyedropper_ultra_precise_${Date.now()}_${x}_${y}`);
        resolve(colorInfo);
        return;
      }
      
      // 重み付き平均色を計算（最高精度）
      const avgR = Math.round(totalR / totalWeight);
      const avgG = Math.round(totalG / totalWeight);
      const avgB = Math.round(totalB / totalWeight);
      
      // 💎 極限精度ColorInfo オブジェクトを作成
      const colorInfo = createColorInfo(avgR, avgG, avgB, `eyedropper_ultra_precise_${Date.now()}_${x}_${y}`);
      resolve(colorInfo);
      
    } catch (error) {
      reject(new Error(`色の抽出に失敗しました: ${error}`));
    }
  });
}

/**
 * 💎 極限精度画像座標変換（サブピクセル精度対応）
 */
export function getCanvasCoordinatesFromImageClick(
  event: React.MouseEvent<HTMLImageElement>,
  imageElement: HTMLImageElement
): { x: number; y: number } {
  // 画像要素の境界を取得
  const rect = imageElement.getBoundingClientRect();
  
  // 💎 サブピクセル精度クリック座標（フロート精度）
  const clickX = event.clientX - rect.left;
  const clickY = event.clientY - rect.top;
  
  // 画像の自然サイズと表示サイズ（高精度）
  const naturalWidth = imageElement.naturalWidth;
  const naturalHeight = imageElement.naturalHeight;
  const displayWidth = rect.width;
  const displayHeight = rect.height;
  
  // 💎 アスペクト比を高精度で計算
  const naturalAspectRatio = naturalWidth / naturalHeight;
  const displayAspectRatio = displayWidth / displayHeight;
  
  let sourceX: number, sourceY: number;
  
  // 💎 object-contain の動作を極限精度でシミュレート
  if (naturalAspectRatio > displayAspectRatio) {
    // 画像が横に長い → 上下に黒帯
    const scaledHeight = displayWidth / naturalAspectRatio;
    const yOffset = (displayHeight - scaledHeight) / 2;
    
    // クリック位置が画像領域内かチェック
    const adjustedY = clickY - yOffset;
    
    if (adjustedY < 0 || adjustedY > scaledHeight) {
      // 黒帯部分がクリックされた場合（端っこの色を抽出）
      sourceX = Math.round((clickX / displayWidth) * naturalWidth);
      sourceY = adjustedY < 0 ? 0 : naturalHeight - 1;
    } else {
      // 実際の画像部分がクリックされた場合（高精度変換）
      sourceX = (clickX / displayWidth) * naturalWidth;
      sourceY = (adjustedY / scaledHeight) * naturalHeight;
    }
  } else {
    // 画像が縦に長い → 左右に黒帯
    const scaledWidth = displayHeight * naturalAspectRatio;
    const xOffset = (displayWidth - scaledWidth) / 2;
    
    // クリック位置が画像領域内かチェック
    const adjustedX = clickX - xOffset;
    
    if (adjustedX < 0 || adjustedX > scaledWidth) {
      // 黒帯部分がクリックされた場合（端っこの色を抽出）
      sourceX = adjustedX < 0 ? 0 : naturalWidth - 1;
      sourceY = Math.round((clickY / displayHeight) * naturalHeight);
    } else {
      // 実際の画像部分がクリックされた場合（高精度変換）
      sourceX = (adjustedX / scaledWidth) * naturalWidth;
      sourceY = (clickY / displayHeight) * naturalHeight;
    }
  }
  
  // 💎 最終的なピクセル座標への変換（四捨五入で最適化）
  const finalX = Math.max(0, Math.min(naturalWidth - 1, Math.round(sourceX)));
  const finalY = Math.max(0, Math.min(naturalHeight - 1, Math.round(sourceY)));
  
  return { x: finalX, y: finalY };
}

/**
 * 🎨 画像にスポイト機能を追加するヘルパー（デバッグ情報付き）
 */
export async function handleImageEyedropper(
  event: React.MouseEvent<HTMLImageElement>,
  imageElement: HTMLImageElement
): Promise<ColorInfo> {
  const { x, y } = getCanvasCoordinatesFromImageClick(event, imageElement);
  
  // 🔍 デバッグ情報（開発時のみ）
  if (process.env.NODE_ENV === 'development') {
    const rect = imageElement.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;
    
    console.group('🎨 Eyedropper Debug Info');
    console.log('📍 Click Position:', { clickX, clickY });
    console.log('🖼️ Image Display:', { width: rect.width, height: rect.height });
    console.log('🎆 Image Natural:', { width: imageElement.naturalWidth, height: imageElement.naturalHeight });
    console.log('🎯 Extracted Position:', { x, y });
    console.log('📈 Scale Ratio:', { 
      scaleX: imageElement.naturalWidth / rect.width,
      scaleY: imageElement.naturalHeight / rect.height
    });
    console.groupEnd();
  }
  
  return extractColorFromImageAtPosition(imageElement, x, y);
}
