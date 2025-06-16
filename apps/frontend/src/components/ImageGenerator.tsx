import React, { useState } from 'react'
import { Label } from './ui/label'
import { Input } from './ui/input'
import { Button } from './ui/button'
import { Slider } from './ui/slider'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import ModelSelector from './ModelSelector'

interface ImageGeneratorProps {
  isDarkMode: boolean
  onImageGenerated: (imageData: { filename: string; path: string; category: string }) => void
}

interface GenerationParams {
  prompt: string
  negative_prompt?: string
  steps: number
  cfg_scale: number
  width: number
  height: number
  sampler_name: string
  seed: number
  model_id?: string
}

const ImageGenerator: React.FC<ImageGeneratorProps> = ({ isDarkMode, onImageGenerated }) => {
  const [params, setParams] = useState<GenerationParams>({
    prompt: '',
    negative_prompt: '',
    steps: 20,
    cfg_scale: 7,
    width: 768,
    height: 1344,
    sampler_name: 'DPM++ 2M Karras',
    seed: -1,
  })
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null)
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null)

  const BASE_URL = `http://${window.location.hostname}:3000`

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsGenerating(true)
    setError(null)
    setGeneratedImageUrl(null)

    const payload = {
      prompt: params.prompt,
      negative_prompt: params.negative_prompt,
      width: params.width,
      height: params.height,
      steps: params.steps,
      cfg_scale: params.cfg_scale,
      sampler_name: params.sampler_name,
      seed: params.seed,
      model_id: selectedModelId,
    }

    try {
      const response = await fetch(`${BASE_URL}/api/generate-image`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail?.[0]?.msg || '画像の生成に失敗しました')
      }

      const responseData = await response.json()
      const newImageUrl = `${BASE_URL}/api/serve-image/unclassified/${responseData.filename}`
      
      setGeneratedImageUrl(newImageUrl)
      onImageGenerated(responseData)
      setParams(prev => ({ ...prev, prompt: '', negative_prompt: '', seed: -1 }))
    } catch (err: any) {
      setError(err.message)
      console.error('画像生成エラー:', err)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="mb-8 p-6 border rounded-lg shadow-sm">
      <h2 className="text-2xl font-semibold mb-4">画像生成 (txt2img)</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="prompt">プロンプト</Label>
          <Input
            id="prompt"
                value={params.prompt}
                onChange={(e) => setParams(prev => ({ ...prev, prompt: e.target.value }))}
                placeholder="画像の説明を入力してください"
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

            <ModelSelector
              selectedModelId={selectedModelId}
              onModelSelect={setSelectedModelId}
              isDarkMode={isDarkMode}
            />

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="width">幅</Label>
          <Input
                  id="width"
                  type="number"
                  value={params.width}
                  onChange={(e) => setParams(prev => ({ ...prev, width: parseInt(e.target.value) }))}
                  min={256}
                  max={2048}
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
                  max={2048}
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
              {isGenerating ? '生成中...' : '画像を生成'}
        </Button>
      </form>
        </div>
        <div className="flex flex-col items-center justify-center p-4 border rounded-lg bg-muted/20">
          <h3 className="text-lg font-semibold mb-4">生成結果</h3>
          {isGenerating && (
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mb-4"></div>
              <p>画像を生成中...</p>
            </div>
          )}
          {!isGenerating && generatedImageUrl && (
            <div className="w-full h-full flex justify-center items-center">
              <img src={generatedImageUrl} alt="Generated Image" className="max-w-full max-h-[500px] object-contain rounded shadow-md" />
            </div>
          )}
          {!isGenerating && !generatedImageUrl && !error && (
            <div className="text-muted-foreground">
              <p>画像がここに表示されます</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ImageGenerator 