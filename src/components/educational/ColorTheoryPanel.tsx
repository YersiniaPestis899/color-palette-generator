'use client';

import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  ChevronRight, 
  ChevronDown, 
  Lightbulb, 
  Eye, 
  Palette,
  Atom,
  Target,
  Zap,
  Users
} from 'lucide-react';
import { 
  ColorInfo, 
  EducationalMixingResult, 
  ColorTheoryExplanation 
} from '../../types/color';

interface ColorTheoryPanelProps {
  mixingResult?: EducationalMixingResult | null;
  selectedColors?: ColorInfo[];
  showDetailedExplanations?: boolean;
  learningLevel?: 'basic' | 'intermediate' | 'advanced';
}

// 色彩理論のトピック
const colorTheoryTopics = {
  mixing: {
    title: '混色理論',
    icon: Palette,
    color: 'text-purple-500',
    bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    topics: [
      {
        title: '加法混色 (光の混色)',
        content: 'RGB（赤・緑・青）の光を重ね合わせる方法。テレビやモニターで使用される。',
        examples: ['赤 + 緑 = 黄', '緑 + 青 = シアン', '青 + 赤 = マゼンタ'],
        applications: ['テレビ画面', 'モニター', 'スマートフォン', 'LED照明']
      },
      {
        title: '減法混色 (顔料の混色)',
        content: 'CMY（シアン・マゼンタ・イエロー）の色素を混ぜる方法。絵の具や印刷で使用される。',
        examples: ['シアン + マゼンタ = 青', 'マゼンタ + イエロー = 赤', 'イエロー + シアン = 緑'],
        applications: ['絵の具', '印刷（CMYK）', '染料', 'カラーフィルター']
      }
    ]
  },
  harmony: {
    title: '色彩調和',
    icon: Target,
    color: 'text-blue-500',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    topics: [
      {
        title: '補色関係',
        content: '色相環で正反対に位置する色の組み合わせ。最もコントラストが強く、目を引く配色。',
        examples: ['赤 ↔ 緑', '青 ↔ オレンジ', '黄 ↔ 紫'],
        applications: ['看板デザイン', 'ロゴ', 'アクセントカラー', 'アート作品']
      },
      {
        title: '類似色',
        content: '色相環で隣接する色の組み合わせ。調和が取れた穏やかな印象を与える。',
        examples: ['赤→オレンジ→黄', '青→青緑→緑', '紫→赤紫→赤'],
        applications: ['インテリア', 'ファッション', 'ウェブデザイン', '風景画']
      }
    ]
  },
  psychology: {
    title: '色彩心理学',
    icon: Users,
    color: 'text-green-500',
    bgColor: 'bg-green-50 dark:bg-green-900/20',
    topics: [
      {
        title: '暖色系の効果',
        content: '赤、オレンジ、黄色など。活動的で温かい印象を与え、食欲や興奮を促進。',
        examples: ['赤：情熱、エネルギー', 'オレンジ：親しみやすさ', '黄：明るさ、注意'],
        applications: ['レストラン', 'スポーツブランド', '警告サイン', 'セール広告']
      },
      {
        title: '寒色系の効果',
        content: '青、緑、紫など。冷静で落ち着いた印象を与え、集中力や信頼感を高める。',
        examples: ['青：信頼、冷静', '緑：自然、安らぎ', '紫：高貴、神秘'],
        applications: ['企業ロゴ', '病院', '学習環境', '金融機関']
      }
    ]
  }
};

export default function ColorTheoryPanel({
  mixingResult,
  selectedColors = [],
  showDetailedExplanations = true,
  learningLevel = 'intermediate'
}: ColorTheoryPanelProps) {
  const [activeSection, setActiveSection] = useState<string>('mixing');
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set(['mixing']));

  // 混合結果に基づいて適切なセクションを自動選択
  useEffect(() => {
    if (mixingResult) {
      setActiveSection('mixing');
      setExpandedTopics(prev => new Set([...prev, 'mixing']));
    }
  }, [mixingResult]);

  const toggleTopic = (topicKey: string) => {
    setExpandedTopics(prev => {
      const newSet = new Set(prev);
      if (newSet.has(topicKey)) {
        newSet.delete(topicKey);
      } else {
        newSet.add(topicKey);
      }
      return newSet;
    });
  };

  // レベルに応じた内容フィルタリング
  const getContentForLevel = (content: string) => {
    if (learningLevel === 'basic') {
      return content.split('。')[0] + '。'; // 最初の文のみ
    }
    return content;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center">
          <BookOpen className="h-5 w-5 mr-2 text-blue-500" />
          📚 色彩理論ガイド
        </h3>
        
        {/* 学習レベル表示 */}
        <div className="flex items-center space-x-2 text-xs">
          <span className="text-gray-500">レベル:</span>
          <div className={`px-2 py-1 rounded-full text-white ${{
            basic: 'bg-green-500',
            intermediate: 'bg-blue-500',
            advanced: 'bg-purple-500'
          }[learningLevel]}`}>
            {{
              basic: '基礎',
              intermediate: '中級',
              advanced: '上級'
            }[learningLevel]}
          </div>
        </div>
      </div>

      {/* 🧪 混合結果の理論解説（最優先表示） */}
      {mixingResult && (
        <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl border-2 border-blue-200 dark:border-blue-700">
          <div className="flex items-center mb-3">
            <Zap className="h-5 w-5 text-blue-500 mr-2" />
            <h4 className="font-bold text-blue-800 dark:text-blue-300">
              🧪 混合結果の解説
            </h4>
            <div className={`ml-auto px-2 py-1 rounded-full text-xs text-white ${{
              additive: 'bg-green-500',
              subtractive: 'bg-blue-500'
            }[mixingResult.mixingType]}`}>
              {mixingResult.mixingType === 'additive' ? '加法混色' : '減法混色'}
            </div>
          </div>

          <div className="space-y-3">
            {/* 結果表示 */}
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-1">
                {selectedColors.slice(0, 3).map((color, index) => (
                  <React.Fragment key={index}>
                    <div 
                      className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
                      style={{ backgroundColor: color.hex }}
                      title={color.name}
                    />
                    {index < selectedColors.length - 1 && (
                      <span className="text-gray-500">+</span>
                    )}
                  </React.Fragment>
                ))}
              </div>
              <span className="text-gray-500">=</span>
              <div 
                className="w-10 h-10 rounded-full border-2 border-white shadow-md"
                style={{ backgroundColor: mixingResult.hex }}
                title={mixingResult.name}
              />
              <div>
                <p className="font-bold text-sm">{mixingResult.name}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">{mixingResult.hex}</p>
              </div>
            </div>

            {/* 科学的説明 */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                {getContentForLevel(mixingResult.scientificExplanation)}
              </p>
              
              {/* 応用例 */}
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">応用例:</span>
                {mixingResult.realWorldApplications.slice(0, 3).map((app, index) => (
                  <span 
                    key={index}
                    className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs rounded-full"
                  >
                    {app}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 📖 理論セクション */}
      <div className="space-y-3">
        {Object.entries(colorTheoryTopics).map(([key, section]) => {
          const Icon = section.icon;
          const isExpanded = expandedTopics.has(key);
          
          return (
            <div 
              key={key} 
              className={`border rounded-xl overflow-hidden transition-all duration-200 ${
                activeSection === key 
                  ? 'border-blue-300 dark:border-blue-600' 
                  : 'border-gray-200 dark:border-gray-700'
              }`}
            >
              {/* セクションヘッダー */}
              <button
                onClick={() => toggleTopic(key)}
                className={`w-full p-3 text-left transition-colors ${section.bgColor} hover:opacity-80 cursor-pointer`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Icon className={`h-5 w-5 mr-2 ${section.color}`} />
                    <span className="font-bold text-gray-800 dark:text-white">
                      {section.title}
                    </span>
                  </div>
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-gray-500" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-gray-500" />
                  )}
                </div>
              </button>

              {/* セクション内容 */}
              {isExpanded && (
                <div className="p-3 bg-white dark:bg-gray-800 space-y-3">
                  {section.topics.map((topic, topicIndex) => (
                    <div key={topicIndex} className="border-l-4 border-gray-200 dark:border-gray-600 pl-3">
                      <h5 className="font-bold text-sm text-gray-800 dark:text-white mb-1">
                        {topic.title}
                      </h5>
                      
                      <p className="text-sm text-gray-700 dark:text-gray-300 mb-2 leading-relaxed">
                        {getContentForLevel(topic.content)}
                      </p>

                      {/* 例 */}
                      <div className="mb-2">
                        <span className="text-xs font-medium text-gray-600 dark:text-gray-400">例:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {topic.examples.slice(0, learningLevel === 'basic' ? 2 : undefined).map((example, exIndex) => (
                            <span 
                              key={exIndex}
                              className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded"
                            >
                              {example}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* 応用分野 */}
                      {showDetailedExplanations && (
                        <div>
                          <span className="text-xs font-medium text-gray-600 dark:text-gray-400">応用:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {topic.applications.slice(0, learningLevel === 'basic' ? 3 : undefined).map((app, appIndex) => (
                              <span 
                                key={appIndex}
                                className="px-2 py-1 text-xs rounded text-white bg-purple-400"
                              >
                                {app}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 💡 クイック学習ヒント */}
      <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl">
        <div className="flex items-center mb-2">
          <Lightbulb className="h-4 w-4 text-yellow-500 mr-2" />
          <span className="font-bold text-yellow-800 dark:text-yellow-300 text-sm">
            💡 今日の色彩ヒント
          </span>
        </div>
        
        <div className="text-sm text-gray-700 dark:text-gray-300">
          {mixingResult ? (
            mixingResult.mixingType === 'additive' ? (
              <p>💻 <strong>加法混色</strong>はスマートフォンやPCの画面で毎日目にしている色の仕組みです！RGB（赤・緑・青）の光が重なって様々な色を作り出しています。</p>
            ) : (
              <p>🎨 <strong>減法混色</strong>は絵の具や印刷物で使われる色の仕組みです！色を混ぜるほど暗くなるのが特徴で、CMY（シアン・マゼンタ・イエロー）が基本色です。</p>
            )
          ) : (
            <p>🌈 色には「温度」があることを知っていますか？赤やオレンジは「暖色」で温かい感じ、青や緑は「寒色」で涼しい感じを与えます。これは人間の本能的な反応なんです！</p>
          )}
        </div>
      </div>
    </div>
  );
}
