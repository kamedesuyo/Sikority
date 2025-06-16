import { X, ChevronRight } from 'lucide-react'
import { Button } from './ui/button'
import React, { useEffect, useState } from 'react'
import { Check, Copy } from 'lucide-react'

interface ImageModalProps {
  imageUrl: string
  onClose: () => void
  onNext: () => void
  onPrevious: () => void
  metadata: any
  isMobile: boolean
  category?: string
  onClassify?: (rating: string) => void
}

export const ImageModal: React.FC<ImageModalProps> = ({ imageUrl, onClose, onNext, onPrevious, metadata, isMobile, category, onClassify }) => {
  const [showMetadata, setShowMetadata] = useState<boolean>(false)
  const [copiedTooltipPrompt, setCopiedTooltipPrompt] = useState<string | null>(null)
  const [copiedTooltipNegativePrompt, setCopiedTooltipNegativePrompt] = useState<string | null>(null)

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      } else if (event.key === 'ArrowRight') {
        onNext()
      } else if (event.key === 'ArrowLeft') {
        onPrevious()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose, onNext, onPrevious])

  const formatParameters = (params: string) => {
    const lines = params.split('\n')
    const promptLine = lines[0]
    const negativePromptLine = lines.find(line => line.startsWith('Negative prompt:'))
    const negativePrompt = negativePromptLine ? negativePromptLine.replace('Negative prompt:', '').trim() : null
    const paramLines = lines
      .filter(line => !line.startsWith('Negative prompt:'))
      .slice(1)

    const formattedParams = paramLines.map((line: string, index: number) => (
      <div key={index} className="mb-1">
        {line.split(', ').map((param: string, paramIndex: number) => (
          <span key={paramIndex} className="mr-2">
            {param}
          </span>
        ))}
      </div>
    ))

    return { prompt: promptLine, negativePrompt, parameters: formattedParams }
  }

  const formattedMetadata = metadata && metadata.parameters ? formatParameters(metadata.parameters) : null
  const promptToCopy = formattedMetadata ? formattedMetadata.prompt : ''
  const negativePromptToCopy = formattedMetadata ? formattedMetadata.negativePrompt : ''

  const handleCopyPromptLocal = async (prompt: string) => {
    try {
      await navigator.clipboard.writeText(prompt)
      setCopiedTooltipPrompt(prompt)
      setTimeout(() => setCopiedTooltipPrompt(null), 2000)
    } catch (err) {
      console.error('Failed to copy prompt:', err)
    }
  }

  const handleCopyNegativePromptLocal = async (prompt: string) => {
    try {
      await navigator.clipboard.writeText(prompt)
      setCopiedTooltipNegativePrompt(prompt)
      setTimeout(() => setCopiedTooltipNegativePrompt(null), 2000)
    } catch (err) {
      console.error('Failed to copy negative prompt:', err)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75" onClick={onClose}>
      <div
        className="relative flex max-w-full max-h-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative flex-shrink-0 flex items-center justify-center p-4">
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 text-white hover:bg-gray-700 hover:text-white z-10"
            onClick={onClose}
          >
            <X className="h-6 w-6" />
          </Button>

          {!isMobile && metadata && Object.keys(metadata).length > 0 && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-12 text-white hover:bg-gray-700 hover:text-white z-10"
              onClick={() => setShowMetadata(!showMetadata)}
            >
              <ChevronRight className={`h-6 w-6 transform transition-transform ${showMetadata ? 'rotate-90' : ''}`} />
            </Button>
          )}

          <img src={imageUrl} alt="拡大画像" className="max-w-[90vw] max-h-[90vh] object-contain" />

          <div
            className="absolute inset-0 flex"
            onContextMenu={(e) => e.preventDefault()}
          >
            <div
              className="flex-1 cursor-w-resize"
              onClick={onPrevious}
              onMouseDown={(e) => e.button === 2 && onPrevious()}
            ></div>
            <div
              className="flex-1 cursor-e-resize"
              onClick={onNext}
              onMouseDown={(e) => e.button === 2 && onNext()}
            ></div>
          </div>

          {onClassify && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex flex-col items-center gap-2">
              {category && category !== 'unclassified' && (
                <div className="flex items-center gap-2 bg-background/80 p-2 rounded-lg shadow-lg">
                  <Button
                    onClick={() => onClassify(category)}
                    className={`${
                      category === 'S' ? 'bg-purple-500 hover:bg-purple-600' :
                      category === 'A' ? 'bg-blue-500 hover:bg-blue-600' :
                      category === 'B' ? 'bg-green-500 hover:bg-green-600' :
                      category === 'C' ? 'bg-yellow-500 hover:bg-yellow-600' :
                      'bg-red-500 hover:bg-red-600'
                    } text-white text-xl px-6 py-2`}
                  >
                    {category}
                  </Button>
                  <div className="flex gap-1">
                    {['S', 'A', 'B', 'C', 'D'].map((rating) => (
                      <Button
                        key={rating}
                        onClick={() => onClassify(rating)}
                        className={`${
                          rating === 'S' ? 'bg-purple-500 hover:bg-purple-600' :
                          rating === 'A' ? 'bg-blue-500 hover:bg-blue-600' :
                          rating === 'B' ? 'bg-green-500 hover:bg-green-600' :
                          rating === 'C' ? 'bg-yellow-500 hover:bg-yellow-600' :
                          'bg-red-500 hover:bg-red-600'
                        } text-white`}
                        variant="outline"
                        size="sm"
                      >
                        {rating}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
              {(!category || category === 'unclassified') && (
                <div className="flex gap-2 bg-background/80 p-2 rounded-lg shadow-lg">
                  {['S', 'A', 'B', 'C', 'D'].map((rating) => (
                    <Button
                      key={rating}
                      onClick={() => onClassify(rating)}
                      className={`${
                        rating === 'S' ? 'bg-purple-500 hover:bg-purple-600' :
                        rating === 'A' ? 'bg-blue-500 hover:bg-blue-600' :
                        rating === 'B' ? 'bg-green-500 hover:bg-green-600' :
                        rating === 'C' ? 'bg-yellow-500 hover:bg-yellow-600' :
                        'bg-red-500 hover:bg-red-600'
                      } text-white`}
                    >
                      {rating}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* メタデータ表示エリア (表示状態に応じてクラスを切り替え) */}
        {showMetadata && (
          <div className="flex-shrink-0 w-80 p-4 overflow-y-auto max-h-full rounded-r-lg">
            {metadata && Object.keys(metadata).length > 0 ? (
              <div className="text-xs text-foreground mt-2 p-2 bg-muted rounded break-all">
                <h4 className="font-semibold mb-1">メタデータ:</h4>
                {formattedMetadata && (
                  <div className="mb-2">
                    <h5 className="font-bold text-sm">プロンプト:</h5>
                    <div
                      className="relative group cursor-pointer"
                      onClick={() => handleCopyPromptLocal(promptToCopy)}
                    >
                      <pre className="whitespace-pre-wrap overflow-x-auto text-sm bg-accent/50 p-2 rounded hover:bg-muted transition-colors">
                        {promptToCopy}
                      </pre>
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {copiedTooltipPrompt === promptToCopy ? (
                          <div className="relative">
                            <Check className="h-4 w-4 text-green-500" />
                            <div className="absolute left-1/2 -translate-x-1/2 top-full mt-1 px-2 py-1 bg-popover text-popover-foreground text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                              コピーしました
                            </div>
                          </div>
                        ) : (
                          <Copy className="h-4 w-4 text-gray-500" />
                        )}
                      </div>
                    </div>
                    {formattedMetadata.negativePrompt && (
                      <>
                        <h5 className="font-bold text-sm mt-2">ネガティブプロンプト:</h5>
                        <div
                          className="relative group cursor-pointer"
                          onClick={() => handleCopyNegativePromptLocal(negativePromptToCopy || '')}
                        >
                          <pre className="whitespace-pre-wrap overflow-x-auto text-sm bg-accent/50 p-2 rounded hover:bg-muted transition-colors">
                            {formattedMetadata.negativePrompt}
                          </pre>
                          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            {copiedTooltipNegativePrompt === negativePromptToCopy ? (
                              <div className="relative">
                                <Check className="h-4 w-4 text-green-500" />
                                <div className="absolute left-1/2 -translate-x-1/2 top-full mt-1 px-2 py-1 bg-popover text-popover-foreground text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                  コピーしました
                                </div>
                              </div>
                            ) : (
                              <Copy className="h-4 w-4 text-gray-500" />
                            )}
                          </div>
                        </div>
                      </>
                    )}
                    {formattedMetadata.parameters.length > 0 && (
                      <>
                        <h5 className="font-bold text-sm mt-2">生成パラメータ:</h5>
                        <div className="text-foreground">
                          {formattedMetadata.parameters}
                        </div>
                      </>
                    )}
                  </div>
                )}
                {Object.entries(metadata).map(([key, value]) => {
                  if (key === 'parameters') return null;
                  return (
                    <div key={key} className="mb-1">
                      <span className="font-semibold">{key}: </span>
                      <span className="text-foreground">
                        {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-foreground mt-2 p-2 bg-muted rounded break-all">メタデータがありません。</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 