export interface ColorInfo {
  hex: string;
  rgb: {
    r: number;
    g: number;
    b: number;
  };
  hsl: {
    h: number;
    s: number;
    l: number;
  };
  name?: string;
  id?: string;
}

export interface ColorPalette {
  id: string;
  name: string;
  colors: ColorInfo[];
  createdAt: Date;
  imageUrl?: string;
  fileName?: string; // 画像ファイル名
}

export interface MixedColor extends ColorInfo {
  parentColors: string[]; // 元の色のIDリスト
  ratio: number[]; // 混合比率
}

export type PaletteTheme = 'elementary' | 'middle';

export interface PaletteGeneratorProps {
  onPaletteGenerated: (palette: ColorPalette) => void;
}

export interface ColorCardProps {
  color: ColorInfo;
  onColorChange?: (newColor: ColorInfo) => void;
  onRemove?: () => void;
  showControls?: boolean;
  theme?: PaletteTheme;
  onMixWith?: (color: ColorInfo) => void;
  isMixMode?: boolean;
}

export interface ImageUploaderProps {
  onImageUploaded: (imageUrl: string, file: File) => void;
  isLoading?: boolean;
}

export interface PaletteDisplayProps {
  palette: ColorPalette;
  onSave?: () => void;
  onShare?: () => void;
  onReset?: () => void;
  theme?: PaletteTheme;
}

export interface ColorMixerProps {
  colors: ColorInfo[];
  onColorMixed: (mixedColor: MixedColor) => void;
  onColorExtracted?: (extractedColor: ColorInfo) => void; // ドラッグ&ドロップで抽出色一覧に追加
  onColorRemoved?: (removedColor: ColorInfo) => void; // 抽出色を削除
  theme?: PaletteTheme;
  extractedColors?: ColorInfo[]; // 🎨 スポイトで抽出した色
  // アクションボタン用のprops
  onSave?: () => void;
  onShare?: () => void;
  onReset?: () => void;
  showExportMenu?: boolean;
  onToggleExportMenu?: () => void;
  onExport?: (format: string) => void;
}

export type ColorFormat = 'hex' | 'rgb' | 'hsl';

export interface ColorExportOptions {
  format: ColorFormat;
  includeNames: boolean;
  fileType: 'json' | 'css' | 'scss' | 'text';
}

// 🎓 中高生向け教育的機能の型定義
export interface ColorScience {
  wavelength?: number; // ナノメートル単位の波長
  luminance: number; // 輝度
  chromaticity: {
    x: number;
    y: number;
  }; // 色度座標
}

export interface EducationalColorInfo extends ColorInfo {
  science: ColorScience;
  wheelPosition: {
    angle: number; // 色相環上の角度（0-360度）
    radius: number; // 中心からの距離（彩度）
  };
  psychologyEffects: string[]; // 色彩心理効果
  harmonyColors: {
    complementary: string;
    analogous: string[];
    triadic: string[];
    tetradic: string[];
  };
}

export interface ColorTheoryExplanation {
  title: string;
  description: string;
  principles: string[];
  examples: {
    before: ColorInfo[];
    after: ColorInfo;
    explanation: string;
  }[];
}

export interface EducationalMixingResult extends MixedColor {
  theory: ColorTheoryExplanation;
  mixingType: 'additive' | 'subtractive'; // 加法混色 or 減法混色
  scientificExplanation: string;
  realWorldApplications: string[];
}

export interface ColorWheelProps {
  selectedColor?: ColorInfo;
  onColorSelect?: (color: ColorInfo) => void;
  showHarmonyLines?: boolean;
  showAngles?: boolean;
  size?: number;
}



export interface MiddleSchoolColorMixerProps extends ColorMixerProps {
  onEducationalMixingResult?: (result: EducationalMixingResult) => void;
  showTheory?: boolean;
  showColorWheel?: boolean;
  // learningMode は削除 - 常に全機能有効
}

// 学習モード機能は削除 - 常に全機能有効
