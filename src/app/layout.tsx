import { Inter } from 'next/font/google';
import { Metadata } from 'next';
import './globals.css';
import ThemeInitializer from './ThemeInitializer';

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap'
});

export const metadata: Metadata = {
  title: 'Color Palette Generator - 画像から美しいカラーパレットを生成',
  description: '画像をアップロードするだけで、AIが自動的に美しいカラーパレットを生成します。デザイナーや開発者に最適なツールです。',
  keywords: ['カラーパレット', '色抽出', 'デザイン', 'ツール', 'AI', '画像処理'],
  authors: [{ name: 'Karum' }],
  openGraph: {
    title: 'Color Palette Generator',
    description: '画像から美しいカラーパレットを自動生成',
    type: 'website',
    url: 'https://color-palette-generator.vercel.app',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Color Palette Generator',
    description: '画像から美しいカラーパレットを自動生成',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#3b82f6" />
      </head>
      <body className={`antialiased ${inter.className}`}>
        <ThemeInitializer />
        {children}
      </body>
    </html>
  );
}
