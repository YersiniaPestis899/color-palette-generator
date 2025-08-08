"use client";

import React, { useState, useCallback } from "react";
import { Palette, Settings, Sparkles, Briefcase } from "lucide-react";
import {
  ColorPalette,
  PaletteTheme,
  PaletteGeneratorProps,
} from "../types/color";
import { generatePaletteFromImage } from "../utils/imageUtils";
import ImageUploader from "./ImageUploader";
import ElementaryPaletteDisplay from "./ElementaryPaletteDisplay";
import MiddleSchoolPaletteDisplay from "./MiddleSchoolPaletteDisplay";
import Header from "./Header";
import Footer from "./Footer";
import HowToUseModal from "./HowToUseModal";
import SavedPalettes from "./SavedPalettes";

export default function ColorPaletteGenerator({
  onPaletteGenerated,
}: PaletteGeneratorProps) {
  const [currentPalette, setCurrentPalette] = useState<ColorPalette | null>(
    null
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [colorCount, setColorCount] = useState(5);
  const [savedPalettes, setSavedPalettes] = useState<ColorPalette[]>([]);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showHowToUseModal, setShowHowToUseModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paletteTheme, setPaletteTheme] = useState<PaletteTheme>("elementary");

  // ユニークIDを生成するヘルパー関数
  const generateUniqueId = useCallback(() => {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substr(2, 9);
    const randomNumber = Math.floor(Math.random() * 1000000);
    const performanceNow = Math.floor(performance.now() * 1000);
    return `palette_${timestamp}_${randomString}_${randomNumber}_${performanceNow}`;
  }, []);

  const handleImageUploaded = useCallback(
    async (imageUrl: string, file: File) => {
      setIsGenerating(true);
      setError(null);

      try {
        const { colors, imageUrl: processedImageUrl } =
          await generatePaletteFromImage(file, colorCount);

        const palette: ColorPalette = {
          id: generateUniqueId(),
          name: `${file.name.split(".")[0]} の色`,
          colors,
          createdAt: new Date(),
          imageUrl: processedImageUrl,
          fileName: file.name, // ファイル名を保存
        };

        setCurrentPalette(palette);

        // 親コンポーネントに生成されたパレットを通知
        onPaletteGenerated(palette);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "パレットの生成に失敗しました"
        );
      } finally {
        setIsGenerating(false);
      }
    },
    [colorCount, onPaletteGenerated, generateUniqueId]
  );

  const handleSavePalette = useCallback(() => {
    if (!currentPalette) return;

    // 既に保存済みかチェック（IDで比較）
    const isAlreadySaved = savedPalettes.some(
      (palette) => palette.id === currentPalette.id
    );
    if (isAlreadySaved) {
      console.log("パレットは既に保存済みです:", currentPalette.id);
      return;
    }

    const updated = [...savedPalettes, currentPalette];
    setSavedPalettes(updated);

    // ローカルストレージに保存
    try {
      localStorage.setItem("colorPalettes", JSON.stringify(updated));
    } catch (error) {
      console.error("パレットの保存に失敗しました:", error);
    }
  }, [currentPalette, savedPalettes]);

  const handleSharePalette = useCallback(() => {
    console.log("パレットを共有しました:", currentPalette);
  }, [currentPalette]);

  const handleReset = useCallback(() => {
    setCurrentPalette(null);
    setError(null);
  }, []);

  const handleToggleSettings = useCallback(() => {
    setShowSettingsModal(!showSettingsModal);
  }, [showSettingsModal]);

  const handleShowHowToUse = useCallback(() => {
    setShowSettingsModal(false);
    setShowHowToUseModal(true);
  }, []);

  const handleCloseHowToUseModal = useCallback(() => {
    setShowHowToUseModal(false);
  }, []);

  const handleThemeChange = useCallback((theme: PaletteTheme) => {
    setPaletteTheme(theme);
  }, []);

  // テーマ情報
  const themeInfo = {
    elementary: {
      name: "🎨 子供向け",
      description: "おおきくて楽しいパレット",
      color: "from-pink-400 to-purple-400",
      icon: Sparkles,
    },
    middle: {
      name: "💼 大人向け",
      description: "プロ向け高機能パレット",
      color: "from-blue-400 to-green-400",
      icon: Briefcase,
    },
  };

  // 初期化時にローカルストレージからパレットを読み込み
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem("colorPalettes");
      if (saved) {
        setSavedPalettes(JSON.parse(saved));
      }
    } catch (error) {
      console.error("保存済みパレットの読み込みに失敗しました:", error);
    }
  }, []);

  // テーマに応じてパレット表示コンポーネントを選択
  const renderPaletteDisplay = () => {
    if (!currentPalette) return null;

    const commonProps = {
      palette: currentPalette,
      onSave: handleSavePalette,
      onShare: handleSharePalette,
      onReset: handleReset,
      theme: paletteTheme,
    };

    switch (paletteTheme) {
      case "elementary":
        return <ElementaryPaletteDisplay {...commonProps} />;
      case "middle":
      default:
        return <MiddleSchoolPaletteDisplay {...commonProps} />;
    }
  };

  return (
    <div className="min-h-screen theme-bg-main">
      {/* 新しいヘッダーコンポーネント */}
      <Header
        paletteTheme={paletteTheme}
        onThemeChange={handleThemeChange}
        showSettings={showSettingsModal}
        onToggleSettings={handleToggleSettings}
        currentPalette={currentPalette}
        colorCount={colorCount}
        onColorCountChange={setColorCount}
        onShowHowToUse={handleShowHowToUse}
      />

      {/* ヘッダーとメインコンテンツの間の隙間 */}
      <div className="h-4 lg:h-12"></div>

      {/* メインコンテンツ */}
      <main className="w-full px-8 sm:px-10 lg:px-16 xl:px-20">
        {/* エラー表示 */}
        {error && (
          <div className="mb-6 lg:mb-8 p-4 lg:p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg lg:rounded-xl">
            <div className="flex items-center space-x-2 lg:space-x-3">
              <div className="w-3 h-3 lg:w-4 lg:h-4 bg-red-500 rounded-full"></div>
              <span className="text-red-600 font-medium text-base lg:text-lg xl:text-xl">
                エラー
              </span>
            </div>
            <p className="text-red-500 mt-2 lg:mt-3 text-base lg:text-lg">
              {error}
            </p>
          </div>
        )}

        {/* パレット表示またはアップロード */}
        {currentPalette ? (
          renderPaletteDisplay()
        ) : (
          <div className="space-y-8">
            {/* 画像アップロード */}
            <div className="text-center">
              <h2
                className={`text-2xl lg:text-3xl xl:text-4xl font-bold theme-text-primary mb-4 lg:mb-6 ${
                  paletteTheme === "elementary"
                    ? "theme-elementary-heading"
                    : ""
                }`}
              >
                🎨 画像から色を抽出しましょう
              </h2>
              <p
                className={`text-base lg:text-lg xl:text-xl theme-text-secondary mb-6 lg:mb-8 max-w-4xl mx-auto ${
                  paletteTheme === "elementary" ? "theme-elementary-text" : ""
                }`}
              >
                お気に入りの画像をアップロードして、美しいカラーパレットを自動生成します
              </p>

              <ImageUploader
                onImageUploaded={handleImageUploaded}
                isLoading={isGenerating}
              />
            </div>

            {/* 保存済みパレット */}
            <SavedPalettes
              savedPalettes={savedPalettes}
              onPaletteSelect={setCurrentPalette}
            />
          </div>
        )}
      </main>

      {/* メインコンテンツとフッターの間の隙間 */}
      <div className="h-6 lg:h-12"></div>

      {/* モーダル */}
      <HowToUseModal
        isOpen={showHowToUseModal}
        onClose={handleCloseHowToUseModal}
      />

      {/* フッター */}
      <Footer />
    </div>
  );
}
