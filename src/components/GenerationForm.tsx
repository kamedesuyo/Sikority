import React, { useState } from 'react';
import { GenerationParams } from '../types/generation';
import { generateImage } from '../utils/api';
import config from '../../config/generation.json';

export const GenerationForm: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    setError(null);

    try {
      const params: GenerationParams = {
        prompt,
        ...config.default_params,
      };

      const response = await generateImage(params);
      setResult(response.images[0]);
    } catch (err) {
      setError(err instanceof Error ? err.message : '生成中にエラーが発生しました');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="p-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="prompt" className="block text-sm font-medium text-gray-700">
            プロンプト
          </label>
          <textarea
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            rows={4}
            required
          />
        </div>

        <button
          type="submit"
          disabled={isGenerating}
          className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {isGenerating ? '生成中...' : '生成'}
        </button>
      </form>

      {error && (
        <div className="mt-4 rounded-md bg-red-50 p-4">
          <div className="text-sm text-red-700">{error}</div>
        </div>
      )}

      {result && (
        <div className="mt-4">
          <img src={`data:image/png;base64,${result}`} alt="生成結果" className="max-w-full rounded-lg shadow-lg" />
        </div>
      )}
    </div>
  );
}; 