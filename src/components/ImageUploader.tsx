"use client";

import React, { useCallback, useState } from "react";
import { Upload, X } from "lucide-react";
import { ImageUploaderProps } from "../types/color";

export default function ImageUploader({
  onImageUploaded,
  isLoading = false,
}: ImageUploaderProps) {
  const [dragActive, setDragActive] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const handleFile = useCallback(
    (file: File) => {
      const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
      const maxSize = 10 * 1024 * 1024; // 10MB

      if (!validTypes.includes(file.type)) {
        alert("JPEG、PNG、GIF、WebPファイルのみサポートされています");
        return;
      }

      if (file.size > maxSize) {
        alert("ファイルサイズは10MB以下にしてください");
        return;
      }

      const imageUrl = URL.createObjectURL(file);
      setPreviewImage(imageUrl);
      onImageUploaded(imageUrl, file);
    },
    [onImageUploaded]
  );

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleFile(e.dataTransfer.files[0]);
      }
    },
    [handleFile]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      e.preventDefault();
      if (e.target.files && e.target.files[0]) {
        handleFile(e.target.files[0]);
      }
    },
    [handleFile]
  );

  const clearPreview = useCallback(() => {
    if (previewImage) {
      URL.revokeObjectURL(previewImage);
      setPreviewImage(null);
    }
  }, [previewImage]);

  return (
    <div className="w-full theme-elementary-text">
      {!previewImage ? (
        <div
          className={`
            relative border-2 border-dashed rounded-lg lg:rounded-xl p-4 lg:p-6 xl:p-8 text-center transition-colors duration-200 min-h-[120px] lg:min-h-[150px] xl:min-h-[180px] flex items-center justify-center
            ${
              dragActive
                ? "border-blue-500 theme-info-box"
                : "theme-upload-border"
            }
            ${isLoading ? "pointer-events-none opacity-50" : ""}
          `}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            type="file"
            accept="image/*"
            onChange={handleChange}
            disabled={isLoading}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />

          <div className="flex flex-col items-center justify-center space-y-2 lg:space-y-3 xl:space-y-4">
            {isLoading ? (
              <div className="animate-spin rounded-full h-10 w-10 lg:h-12 lg:w-12 xl:h-14 xl:w-14 border-b-4 lg:border-b-6 border-blue-600"></div>
            ) : (
              <Upload className="h-10 w-10 lg:h-12 lg:w-12 xl:h-14 xl:w-14 text-gray-400" />
            )}

            <div className="space-y-1 lg:space-y-2 xl:space-y-3 flex flex-col items-center">
              <p className="text-lg lg:text-xl xl:text-2xl font-medium theme-text-primary">
                {isLoading ? "処理中..." : "画像をアップロード"}
              </p>
              <p className="text-sm lg:text-base xl:text-lg theme-text-secondary">
                クリックまたはドラッグ＆ドロップしてください
              </p>
              <p className="text-xs lg:text-sm xl:text-base theme-text-muted">
                JPEG、PNG、GIF、WebP (最大10MB)
              </p>

              {/* 最適な結果のための注意書き */}
              {!isLoading && (
                <div className="mt-2 lg:mt-3 p-3 lg:p-4 theme-info-box rounded-lg border w-fit mx-auto">
                  <h3 className="text-sm lg:text-base font-semibold mb-2 text-center">
                    ※最適な結果のために
                  </h3>
                  <div className="text-xs lg:text-sm space-y-1 text-left">
                    <p>
                      •{" "}
                      <span className="font-semibold">
                        高解像度で色彩豊かな画像
                      </span>
                      を使用してください
                    </p>
                    <p>
                      •{" "}
                      <span className="font-semibold">
                        風景、アートワーク、写真
                      </span>
                      などが最適です
                    </p>
                    <p>
                      • 色の数を
                      <span className="font-semibold">3〜10色で調整</span>
                      できます
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="relative">
          <div className="relative rounded-lg lg:rounded-xl overflow-hidden shadow-lg lg:shadow-xl bg-gray-100 dark:bg-gray-800 flex justify-center items-center min-h-[120px]">
            <img
              src={previewImage}
              alt="アップロード画像"
              className="max-w-full max-h-64 lg:max-h-80 xl:max-h-96 object-contain rounded-lg"
            />

            {/* オーバーレイ */}
            <div className="absolute inset-0 bg-black/20 opacity-0 hover:opacity-100 transition-opacity duration-200">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-white/90 dark:bg-gray-800/90 rounded-lg lg:rounded-xl p-4 lg:p-6">
                  <p className="text-base lg:text-lg xl:text-xl theme-text-primary">
                    📸 カラーパレット生成中...
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* クリアボタン */}
          <button
            onClick={clearPreview}
            className="absolute top-3 lg:top-4 right-3 lg:right-4 p-2 lg:p-3 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors duration-200 cursor-pointer"
            aria-label="画像を削除"
          >
            <X className="h-5 w-5 lg:h-6 lg:w-6" />
          </button>
        </div>
      )}
    </div>
  );
}
