/**
 * フォント管理ユーティリティ
 * 子供向けフォント（M PLUS Rounded 1c）の適用を一元管理
 */

export type PaletteTheme = 'elementary' | 'middle' | 'advanced';
export type FontType = 'text' | 'heading' | 'button';

/**
 * テーマに基づいて適切なフォントクラス名を返す
 * @param theme パレットテーマ
 * @param fontType フォントタイプ
 * @returns CSSクラス名
 */
export const getFontClass = (theme?: PaletteTheme, fontType: FontType = 'text'): string => {
  if (theme === 'elementary') {
    switch (fontType) {
      case 'heading':
        return 'theme-elementary-heading';
      case 'button':
        return 'theme-elementary-button';
      case 'text':
      default:
        return 'theme-elementary-text';
    }
  }
  return '';
};

/**
 * テーマに基づいてメインコンテナのフォントクラス名を返す
 * @param theme パレットテーマ
 * @returns CSSクラス名
 */
export const getContainerFontClass = (theme?: PaletteTheme): string => {
  return theme === 'elementary' ? 'theme-elementary' : '';
};

/**
 * 複数のクラス名を結合するヘルパー関数
 * @param classes クラス名の配列
 * @returns 結合されたクラス名文字列
 */
export const combineClasses = (...classes: (string | undefined | null)[]): string => {
  return classes.filter(Boolean).join(' ');
};

/**
 * 子供向けテーマかどうかを判定
 * @param theme パレットテーマ
 * @returns 子供向けテーマの場合true
 */
export const isKidsTheme = (theme?: PaletteTheme): boolean => {
  return theme === 'elementary';
};

/**
 * テーマに応じたフォントクラスを含むclassName文字列を生成
 * @param baseClasses ベースのCSSクラス
 * @param theme パレットテーマ
 * @param fontType フォントタイプ
 * @returns 完全なclassName文字列
 */
export const getThemeClassName = (
  baseClasses: string,
  theme?: PaletteTheme,
  fontType: FontType = 'text'
): string => {
  const fontClass = getFontClass(theme, fontType);
  return combineClasses(baseClasses, fontClass);
};

/**
 * コンポーネント用のフォントクラス設定オブジェクト
 */
export const createFontConfig = (theme?: PaletteTheme) => ({
  container: getContainerFontClass(theme),
  text: getFontClass(theme, 'text'),
  heading: getFontClass(theme, 'heading'),
  button: getFontClass(theme, 'button'),
  isKids: isKidsTheme(theme),
});

/**
 * 使用例:
 * 
 * // 基本的な使用方法
 * const fontClass = getFontClass('elementary', 'heading');
 * 
 * // className文字列の生成
 * const className = getThemeClassName('text-lg font-bold', 'elementary', 'heading');
 * 
 * // コンポーネント全体でのフォント設定
 * const fontConfig = createFontConfig('elementary');
 * <div className={`main-container ${fontConfig.container}`}>
 *   <h1 className={`title ${fontConfig.heading}`}>見出し</h1>
 *   <p className={`description ${fontConfig.text}`}>本文テキスト</p>
 *   <button className={`btn ${fontConfig.button}`}>ボタン</button>
 * </div>
 */
