import React, { useState, useEffect } from 'react';
import { Model } from '../types/model';

interface ModelSelectorProps {
  onModelSelect: (modelId: string) => void;
  isDarkMode: boolean;
}

const ModelSelector: React.FC<ModelSelectorProps> = ({ onModelSelect, isDarkMode }) => {
  const [models, setModels] = useState<Model[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchModels = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/models');
        if (!response.ok) {
          throw new Error('モデルの取得に失敗しました');
        }
        const data = await response.json();
        console.log('取得したモデル一覧:', data);  // デバッグログ
        
        if (Array.isArray(data)) {
          setModels(data);
          if (data.length > 0) {
            setSelectedModel(data[0].id);
            onModelSelect(data[0].id);
          }
        } else {
          throw new Error('モデルデータの形式が不正です');
        }
      } catch (err) {
        console.error('モデル取得エラー:', err);
        setError(err instanceof Error ? err.message : 'モデルの取得中にエラーが発生しました');
      } finally {
        setLoading(false);
      }
    };

    fetchModels();
  }, [onModelSelect]);

  const handleModelChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const modelId = event.target.value;
    setSelectedModel(modelId);
    onModelSelect(modelId);
  };

  if (loading) {
    return <div className={`text-gray-500 ${isDarkMode ? 'text-gray-400' : ''}`}>モデルを読み込み中...</div>;
  }

  if (error) {
    return <div className={`text-red-500 ${isDarkMode ? 'text-red-400' : ''}`}>エラー: {error}</div>;
  }

  return (
    <div className="mb-4">
      <label 
        htmlFor="model-select" 
        className={`block text-sm font-medium mb-1 ${
          isDarkMode ? 'text-gray-200' : 'text-gray-700'
        }`}
      >
        モデルを選択
      </label>
      <div className="relative">
        <select
          id="model-select"
          value={selectedModel}
          onChange={handleModelChange}
          className={`w-full px-3 py-2 rounded-md shadow-sm focus:outline-none focus:ring-2 appearance-none 
            ${isDarkMode ? 'bg-gray-900 border-gray-600 text-gray-200 focus:ring-blue-500 focus:border-blue-500' : 'bg-white border-gray-300 text-gray-900 focus:ring-indigo-500 focus:border-indigo-500'}
            dark:bg-gray-900 dark:border-gray-600 dark:text-gray-200 dark:focus:ring-blue-500 dark:focus:border-blue-500
          }`}
        >
          {models.map((model) => (
            <option 
              key={model.id} 
              value={model.id}
              className={`
                ${isDarkMode ? 'bg-gray-900 text-gray-200' : 'bg-white text-gray-900'}
                dark:bg-gray-900 dark:text-gray-200
              `}
            >
              {model.name} - {model.description}
            </option>
          ))}
        </select>
        <div className={`pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 ${
            isDarkMode ? 'text-gray-200' : 'text-gray-700'
          }`}>
          <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </div>
      </div>
    </div>
  );
};

export default ModelSelector; 