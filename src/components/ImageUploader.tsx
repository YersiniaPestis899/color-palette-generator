'use client';

import React, { useCallback, useState } from 'react';
import { Upload, Image as ImageIcon, X } from 'lucide-react';
import { ImageUploaderProps } from '../types/color';

export default function ImageUploader({ onImageUploaded, isLoading = false }: ImageUploaderProps) {
  const [dragActive, setDragActive] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  }, []);

  const handleFile = useCallback((file: File) => {
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!validTypes.includes(file.type)) {
      alert('JPEG、PNG、GIF、WebPファイルのみサポートされています');
      return;
    }

    if (file.size > maxSize) {
      alert('ファイルサイズは10MB以下にしてください');
      return;
    }

    const imageUrl = URL.createObjectURL(file);
    setPreviewImage(imageUrl);
    onImageUploaded(imageUrl, file);
  }, [onImageUploaded]);

  const clearPreview = useCallback(() => {
    if (previewImage) {
      URL.revokeObjectURL(previewImage);
      setPreviewImage(null);
    }
  }, [previewImage]);

  return (
    <div className="w-full max-w-2xl mx-auto">
      {!previewImage ? (
        <div
          className={`
            relative border-2 border-dashed rounded-lg p-8 text-center transition-colors duration-200
            ${dragActive
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
              : 'border-gray-300 hover:border-gray-400 dark:border-gray-600 dark:hover:border-gray-500'
            }
            ${isLoading ? 'pointer-events-none opacity-50' : ''}
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
          
          <div className="flex flex-col items-center justify-center space-y-4">
            {isLoading ? (
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            ) : (
              <Upload className="h-12 w-12 text-gray-400" />
            )}
            
            <div className="space-y-2">
              <p className="text-lg font-medium text-gray-700 dark:text-gray-300">
                {isLoading ? '処理中...' : '画像をアップロード'}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                クリックまたはドラッグ＆ドロップしてください
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                JPEG、PNG、GIF、WebP (最大10MB)
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative">
          <div className="relative rounded-lg overflow-hidden shadow-lg">
            <img
              src={previewImage}
              alt="アップロード画像"
              className="w-full h-auto max-h-96 object-contain bg-gray-100 dark:bg-gray-800"
            />
            
            {/* オーバーレイ */}
            <div className="absolute inset-0 bg-black/20 opacity-0 hover:opacity-100 transition-opacity duration-200">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-white/90 dark:bg-gray-800/90 rounded-lg p-4">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    📸 カラーパレット生成中...
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* クリアボタン */}
          <button
            onClick={clearPreview}
            className="absolute top-2 right-2 p-1 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors duration-200"
            aria-label="画像を削除"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
      
      {/* 画像形式の説明 */}
      <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div className="flex items-center space-x-2 mb-2">
          <ImageIcon className="h-5 w-5 text-blue-500" />
          <h3 className="font-medium text-gray-700 dark:text-gray-300">
            💡 最適な結果のために
          </h3>
        </div>
        <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
          <li>• 高解像度で色彩豊かな画像を使用してください</li>
          <li>• 風景、アートワーク、写真などが最適です</li>
          <li>• 色の数を3〜10色で調整できます</li>
        </ul>
      </div>
    </div>
  );
}