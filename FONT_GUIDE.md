# 子供向けフォント対応 - M PLUS Rounded 1c

このプロジェクトでは、子供向けの画面に **M PLUS Rounded 1c** フォントを適用し、読みやすく親しみやすいUI体験を提供しています。

## 📝 変更内容

### 1. フォント設定の追加

- `src/app/layout.tsx` に M PLUS Rounded 1c フォントを追加
- Google Fonts から動的に読み込み
- CSS変数 `--font-mplus-rounded` として設定

### 2. CSSクラスの追加 (`src/app/globals.css`)

```css
/* 子供向けフォント用のクラス */
.font-kids                  /* 基本フォント */
.font-kids-light           /* 細字 (weight: 300) */
.font-kids-medium          /* 中字 (weight: 500) */
.font-kids-bold            /* 太字 (weight: 700) */
.font-kids-extrabold       /* 極太字 (weight: 800) */

/* テーマベースのフォントクラス */
.theme-elementary          /* コンテナ用 */
.theme-elementary-text     /* 本文テキスト用 */
.theme-elementary-heading  /* 見出し用 */
.theme-elementary-button   /* ボタン用 */
```

### 3. コンポーネント更新

以下のコンポーネントに子供向けフォントを適用：

- ✅ `ElementaryPaletteDisplay.tsx` - 子供向けパレット表示
- ✅ `ElementaryColorMixer.tsx` - 子供向け色混ぜ機能
- ✅ `ColorPaletteGenerator.tsx` - メイン画面（テーマ条件分岐）

### 4. フォント管理ユーティリティ

`src/utils/theme/fontUtils.ts` を新規作成：

```typescript
// テーマに基づいてフォントクラスを取得
const fontClass = getFontClass('elementary', 'heading');

// クラス名を自動生成
const className = getThemeClassName('text-lg font-bold', 'elementary', 'heading');

// コンポーネント用設定オブジェクト
const fontConfig = createFontConfig('elementary');
```

## 🎨 使用方法

### 基本的な使用方法

```tsx
// 子供向けテーマの判定
{paletteTheme === 'elementary' && (
  <div className="theme-elementary">
    <h1 className="theme-elementary-heading">見出し</h1>
    <p className="theme-elementary-text">本文テキスト</p>
    <button className="theme-elementary-button">ボタン</button>
  </div>
)}
```

### ユーティリティ関数を使用

```tsx
import { getThemeClassName, createFontConfig } from '@/utils/theme/fontUtils';

// 方法1: クラス名を個別に生成
const headingClass = getThemeClassName(
  'text-2xl font-bold text-primary', 
  theme, 
  'heading'
);

// 方法2: 設定オブジェクトを使用
const fontConfig = createFontConfig(theme);
<div className={`container ${fontConfig.container}`}>
  <h1 className={`title ${fontConfig.heading}`}>見出し</h1>
</div>
```

## 🔧 保守性のポイント

### 1. 一元管理
- すべてのフォント設定は `globals.css` で一元管理
- `fontUtils.ts` でロジックを統一

### 2. 条件分岐の統一
```tsx
// 推奨: ユーティリティ関数を使用
const className = getThemeClassName(baseClass, theme, fontType);

// 非推奨: 直接条件分岐
const className = `${baseClass} ${theme === 'elementary' ? 'theme-elementary-text' : ''}`;
```

### 3. タイプセーフ
```typescript
type PaletteTheme = 'elementary' | 'middle' | 'advanced';
type FontType = 'text' | 'heading' | 'button';
```

## 🎯 対象コンポーネント

| コンポーネント | 対応状況 | フォント適用箇所 |
|---|---|---|
| `ElementaryPaletteDisplay` | ✅ 完了 | 全テキスト要素 |
| `ElementaryColorMixer` | ✅ 完了 | 見出し、ボタン、説明文 |
| `ColorPaletteGenerator` | ✅ 完了 | アップロード画面の見出し |
| `educational/*` | 📋 今後対応 | 教育用コンポーネント |

## 🚀 今後の拡張

### 1. 他のテーマサポート
```css
.theme-middle {
  font-family: 'Inter', system-ui, sans-serif;
}

.theme-advanced {
  font-family: 'Source Code Pro', monospace;
}
```

### 2. 多言語サポート
```css
.theme-elementary[lang="en"] {
  font-family: var(--font-mplus-rounded), 'Comic Sans MS', cursive;
}
```

### 3. フォントサイズの調整
```css
.theme-elementary {
  --font-scale: 1.1; /* 子供向けは少し大きめ */
}
```

## 📋 チェックリスト

新しい子供向けコンポーネントを作成する際：

- [ ] メインコンテナに `theme-elementary` クラスを追加
- [ ] 見出しに `theme-elementary-heading` クラスを追加
- [ ] 本文テキストに `theme-elementary-text` クラスを追加
- [ ] ボタンに `theme-elementary-button` クラスを追加
- [ ] `fontUtils.ts` のユーティリティ関数を活用
- [ ] TypeScriptの型チェックを確認

## 🛠 トラブルシューティング

### フォントが適用されない場合

1. **Next.jsのフォント読み込み確認**
   ```tsx
   // layout.tsx
   const mPlusRounded = M_PLUS_Rounded_1c({ 
     subsets: ['latin'], 
     weight: ['300', '400', '500', '700', '800'],
     variable: '--font-mplus-rounded'
   });
   ```

2. **CSS変数の確認**
   ```css
   /* globals.css */
   .theme-elementary {
     font-family: var(--font-mplus-rounded), 'M PLUS Rounded 1c', system-ui, sans-serif;
   }
   ```

3. **クラス名の確認**
   ```tsx
   // 正しい適用方法
   <div className="theme-elementary">
     <h1 className="theme-elementary-heading">見出し</h1>
   </div>
   ```

---

この実装により、子供向けの画面でM PLUS Rounded 1cフォントが適用され、より読みやすく親しみやすいUIを提供できます。
