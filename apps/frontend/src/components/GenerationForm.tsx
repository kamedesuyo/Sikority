import React, { useState } from 'react';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Slider } from './ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

interface GenerationParams {
  prompt: string;
  negative_prompt?: string;
  steps: number;
  cfg_scale: number;
  width: number;
  height: number;
  sampler_name: string;
  seed: number;
}

export const GenerationForm: React.FC = () => {
  const [params, setParams] = useState<GenerationParams>({
    prompt: '',
    negative_prompt: '',
    steps: 20,
    cfg_scale: 7,
    width: 768,
    height: 1344,
    sampler_name: 'DPM++ 2M Karras',
    seed: -1,
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        throw new Error('画像生成に失敗しました');
      }

      // 生成成功後の処理
      setParams(prev => ({ ...prev, prompt: '', negative_prompt: '', seed: -1 }));
    } catch (err) {
      setError(err instanceof Error ? err.message : '予期せぬエラーが発生しました');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-4">
      <div className="space-y-2">
        <Label htmlFor="prompt">プロンプト</Label>
        <Input
          id="prompt"
          value={params.prompt}
          onChange={(e) => setParams(prev => ({ ...prev, prompt: e.target.value }))}
          placeholder="画像の説明を入力してください"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="negative_prompt">ネガティブプロンプト</Label>
        <Input
          id="negative_prompt"
          value={params.negative_prompt}
          onChange={(e) => setParams(prev => ({ ...prev, negative_prompt: e.target.value }))}
          placeholder="除外したい要素を入力してください"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="width">幅</Label>
          <Input
            id="width"
            type="number"
            value={params.width}
            onChange={(e) => setParams(prev => ({ ...prev, width: parseInt(e.target.value) }))}
            min={256}
            max={1024}
            step={64}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="height">高さ</Label>
          <Input
            id="height"
            type="number"
            value={params.height}
            onChange={(e) => setParams(prev => ({ ...prev, height: parseInt(e.target.value) }))}
            min={256}
            max={1024}
            step={64}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="steps">ステップ数: {params.steps}</Label>
        <Slider
          id="steps"
          value={[params.steps]}
          onValueChange={([value]) => setParams(prev => ({ ...prev, steps: value }))}
          min={1}
          max={50}
          step={1}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="cfg_scale">CFG Scale: {params.cfg_scale}</Label>
        <Slider
          id="cfg_scale"
          value={[params.cfg_scale]}
          onValueChange={([value]) => setParams(prev => ({ ...prev, cfg_scale: value }))}
          min={1}
          max={20}
          step={0.5}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="sampler">サンプラー</Label>
        <Select
          value={params.sampler_name}
          onValueChange={(value) => setParams(prev => ({ ...prev, sampler_name: value }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="サンプラーを選択" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="DPM++ 2M Karras">DPM++ 2M Karras</SelectItem>
            <SelectItem value="Euler a">Euler a</SelectItem>
            <SelectItem value="Euler">Euler</SelectItem>
            <SelectItem value="LMS">LMS</SelectItem>
            <SelectItem value="Heun">Heun</SelectItem>
            <SelectItem value="DPM2">DPM2</SelectItem>
            <SelectItem value="DPM++ 2S Karras">DPM++ 2S Karras</SelectItem>
            <SelectItem value="DPM++ SDE Karras">DPM++ SDE Karras</SelectItem>
            <SelectItem value="DPM fast">DPM fast</SelectItem>
            <SelectItem value="DPM adaptive">DPM adaptive</SelectItem>
            <SelectItem value="LMS Karras">LMS Karras</SelectItem>
            <SelectItem value="DPM2 Karras">DPM2 Karras</SelectItem>
            <SelectItem value="DPM++ 2M SDE Karras">DPM++ 2M SDE Karras</SelectItem>
            <SelectItem value="DDIM">DDIM</SelectItem>
            <SelectItem value="PLMS">PLMS</SelectItem>
            <SelectItem value="UniPC">UniPC</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="seed">シード値</Label>
        <Input
          id="seed"
          type="number"
          value={params.seed}
          onChange={(e) => setParams(prev => ({ ...prev, seed: parseInt(e.target.value) }))}
          placeholder="-1 (ランダム)"
        />
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="text-sm text-red-700">{error}</div>
        </div>
      )}

      <Button
        type="submit"
        disabled={isGenerating}
        className="w-full"
      >
        {isGenerating ? '生成中...' : '生成'}
      </Button>
    </form>
  );
}; 