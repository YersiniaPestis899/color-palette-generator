'use client';

import React from 'react';
import { X } from 'lucide-react';

interface HowToUseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HowToUseModal({ isOpen, onClose }: HowToUseModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* オーバーレイ */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm cursor-pointer" 
        onClick={onClose}
      ></div>
      
      {/* モーダル */}
      <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 lg:p-8 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto border border-gray-200 dark:border-gray-700">
        {/* ヘッダー */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl lg:text-2xl font-bold text-gray-800 dark:text-white">
            🚀 使い方
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* 使い方内容 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-blue-600 dark:text-blue-400 font-bold text-xl">1</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">画像をアップロード</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
              JPEG、PNG、GIFなどの画像ファイルをドラッグ&ドロップまたはクリックでアップロードします。高解像度で色彩豊かな画像がおすすめです。
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-green-600 dark:text-green-400 font-bold text-xl">2</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">色を抽出</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
              AIが画像から主要な色を自動的に抽出し、美しいカラーパレットを生成します。設定から抽出色数を調整できます。
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-purple-600 dark:text-purple-400 font-bold text-xl">3</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">活用する</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
              生成されたパレットを保存したり、色を混ぜたり、CSS・JSON形式でエクスポートしてデザインプロジェクトで活用できます。
            </p>
          </div>
        </div>

        {/* 追加のヒント */}
        <div className="mt-8 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
          <h4 className="font-semibold text-yellow-800 dark:text-yellow-300 mb-2">💡 コツ</h4>
          <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
            <li>• 風景、アートワーク、写真などが最適な結果を生み出します</li>
            <li>• 色の数を増やすと詳細な分析が可能ですが、処理時間が長くなります</li>
            <li>• テーマ切り替えで子供向け・大人向けの表示を選択できます</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
