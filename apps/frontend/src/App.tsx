import { useState, useEffect } from 'react'
import { Trash2, FolderSync, Copy, Check, CheckCircle2, Archive, Trash } from 'lucide-react'
import { Button } from './components/ui/button'
import ImageGenerator from './components/ImageGenerator'
import SetupWizard from './components/SetupWizard'
import { Tabs, TabsList, TabsTrigger, TabsContent } from './components/ui/tabs'
import { ImageModal } from './components/ImageModal'
import { cn } from './lib/utils'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./components/ui/alert-dialog"

interface Image {
  filename: string
  path: string
  created_at: number
  metadata?: any
  category: string
}

const ratingColors = {
  S: '!bg-purple-500 hover:!bg-purple-600',
  A: '!bg-blue-500 hover:!bg-blue-600',
  B: '!bg-green-500 hover:!bg-green-600',
  C: '!bg-yellow-500 hover:!bg-yellow-600',
  D: '!bg-red-500 hover:!bg-red-600',
  unclassified: '!bg-gray-500 hover:!bg-gray-600',
  deleted: '!bg-gray-700 hover:!bg-gray-800',
}

function App() {
  const [images, setImages] = useState<Image[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSetupRequired, setIsSetupRequired] = useState<boolean>(false)
  const [showSetupWizard, setShowSetupWizard] = useState<boolean>(false)
  const [currentFolderPath, setCurrentFolderPath] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<string>("evaluation")
  const [filterCategory, setFilterCategory] = useState<string | null>(null)
  const [copiedPrompt, setCopiedPrompt] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [isMobile, setIsMobile] = useState<boolean>(false)
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null)
  const [allImages, setAllImages] = useState<Image[]>([])
  const [confirmDeleteFilename, setConfirmDeleteFilename] = useState<string | null>(null)
  const [confirmDeleteCategory, setConfirmDeleteCategory] = useState<string | null>(null)
  const [confirmDeleteAll, setConfirmDeleteAll] = useState<boolean>(false)
  const [confirmRestoreFilename, setConfirmRestoreFilename] = useState<string | null>(null)
  const [selectedImageFilename, setSelectedImageFilename] = useState<string | null>(null)

  // バックエンドのベースURLを動的に設定
  const BASE_URL = `http://${window.location.hostname}:3000`

  useEffect(() => {
    // モバイルデバイスの検出
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768) // tailwindのmdブレークポイント(768px)を基準とする
    }
    checkIsMobile()
    window.addEventListener('resize', checkIsMobile)
    return () => window.removeEventListener('resize', checkIsMobile)
  }, [])

  useEffect(() => {
    checkSetupStatus()
    fetchAllImages()
  }, [])

  const fetchAllImages = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`${BASE_URL}/api/images`)
      if (!response.ok) {
        throw new Error('画像の取得に失敗しました')
      }
      const data = await response.json()
      setAllImages(data)
      filterImages(data, filterCategory)
      // fetchAllImagesが完了したら、現在の選択画像を再確認
      if (selectedImageFilename) {
        const currentImage = data.find((img: Image) => img.filename === selectedImageFilename)
        if (currentImage) {
          setSelectedImage(`${BASE_URL}${currentImage.path}`)
          const newIndex = data.findIndex((img: Image) => img.filename === selectedImageFilename)
          setSelectedImageIndex(newIndex !== -1 ? newIndex : null)
        } else {
          // 選択画像がもう存在しない場合
          setSelectedImage(null)
          setSelectedImageIndex(null)
          setSelectedImageFilename(null)
        }
      }
    } catch (err: any) {
      setError(err.message)
      setImages([])
    } finally {
      setLoading(false)
    }
  }

  const filterImages = (images: Image[], category: string | null) => {
    if (category) {
      setImages(images.filter(img => img.category.toLowerCase() === category.toLowerCase()))
    } else {
      setImages(images.filter(img => img.category.toLowerCase() !== 'deleted'))
    }
  }

  useEffect(() => {
    filterImages(allImages, filterCategory)
  }, [filterCategory, allImages])

  const checkSetupStatus = async () => {
    try {
      const response = await fetch(`${BASE_URL}/api/status`)
      if (!response.ok) {
        throw new Error('ステータス取得に失敗しました')
      }
      const data = await response.json()
      setIsSetupRequired(!data.unclassified_path)
      setCurrentFolderPath(data.unclassified_path || '未設定')
    } catch (err) {
      console.error('セットアップステータス取得エラー:', err)
      setIsSetupRequired(true)
      setCurrentFolderPath('エラー')
    }
  }

  const handleClassify = async (filename: string, rating: string) => {
    try {
      const response = await fetch(`${BASE_URL}/api/classify/${filename}?rating=${rating}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      if (!response.ok) {
        throw new Error('画像の分類に失敗しました')
      }

      setAllImages(prevImages => {
        return prevImages.map(img => {
          if (img.filename === filename) {
            return {
              ...img,
              category: rating,
              path: `/api/serve-image/${rating}/${filename}`
            }
          }
          return img
        })
      })

      // 拡大表示中の画像の場合、選択状態を更新
      if (selectedImageFilename === filename) {
        setSelectedImage(`${BASE_URL}/api/serve-image/${rating}/${filename}`)
        // allImagesが更新されたので、images配列のインデックスを再確認
        const newIndex = images.findIndex(img => img.filename === filename)
        setSelectedImageIndex(newIndex !== -1 ? newIndex : null)
      }
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleNextImage = () => {
    if (selectedImageIndex !== null && images.length > 0) {
      const nextIndex = (selectedImageIndex + 1) % images.length
      setSelectedImageIndex(nextIndex)
      setSelectedImage(`${BASE_URL}${images[nextIndex].path}`)
      setSelectedImageFilename(images[nextIndex].filename) // ファイル名を更新
    }
  }

  const handlePreviousImage = () => {
    if (selectedImageIndex !== null && images.length > 0) {
      const prevIndex = (selectedImageIndex - 1 + images.length) % images.length
      setSelectedImageIndex(prevIndex)
      setSelectedImage(`${BASE_URL}${images[prevIndex].path}`)
      setSelectedImageFilename(images[prevIndex].filename) // ファイル名を更新
    }
  }

  const handleDelete = async (filename: string, category: string) => {
    // 確認ダイアログを表示
    setConfirmDeleteFilename(filename)
    setConfirmDeleteCategory(category)
    setShowDeleteConfirm(true)
  }

  const executeDelete = async (filename: string, category: string) => {
    try {
      const response = await fetch(`${BASE_URL}/api/images/${filename}?category=${category}`, {
        method: 'DELETE',
      })
      if (!response.ok) {
        throw new Error('画像の削除に失敗しました')
      }
      const data = await response.json()
      // alert(data.message) // ポップアップに置き換えるためコメントアウト

      // allImagesの該当画像のカテゴリを'deleted'に更新
      setAllImages(prevImages => {
        return prevImages.map(img => {
          if (img.filename === filename) {
            return { ...img, category: 'deleted', path: `/api/serve-image/deleted/${filename}` }
          }
          return img
        })
      })

      // 拡大表示中の画像の場合、表示を閉じる
      if (selectedImageFilename === filename) {
        setSelectedImage(null)
        setSelectedImageIndex(null)
        setSelectedImageFilename(null)
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setConfirmDeleteFilename(null)
      setConfirmDeleteCategory(null)
      setShowDeleteConfirm(false)
    }
  }

  const handleRestore = async (filename: string) => {
    // 確認ダイアログを表示
    setConfirmRestoreFilename(filename)
    setShowDeleteConfirm(true)
  }

  const executeRestore = async (filename: string) => {
    try {
      const response = await fetch(`${BASE_URL}/api/restore/${filename}`, {
        method: 'POST',
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || '画像の復元に失敗しました')
      }
      const data = await response.json()
      // alert(data.message) // ポップアップに置き換えるためコメントアウト

      // 復元後、allImagesを再取得することで最新の状態を反映
      await fetchAllImages()

      // 拡大表示中の画像の場合、選択状態を更新
      if (selectedImageFilename === filename) {
        // 復元された画像が再び表示リストに含まれるか確認し、更新
        // fetchAllImagesでselectedImageが更新されるため、ここでは不要
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setConfirmRestoreFilename(null)
      setShowDeleteConfirm(false)
    }
  }

  const handleDeleteAll = async () => {
    // 確認ダイアログを表示
    setConfirmDeleteAll(true)
    setShowDeleteConfirm(true)
  }

  const executeDeleteAll = async () => {
    try {
      const response = await fetch(`${BASE_URL}/api/deleted`, {
        method: 'DELETE',
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'すべての削除済み画像の削除に失敗しました')
      }
      const data = await response.json()
      // alert(data.message) // ポップアップに置き換えるためコメントアウト

      setAllImages([])

      // 拡大表示中の画像の場合、表示を閉じる
      if (selectedImage !== null) {
        setSelectedImage(null)
        setSelectedImageIndex(null)
        setSelectedImageFilename(null)
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setConfirmDeleteAll(false)
      setShowDeleteConfirm(false)
    }
  }

  const handleCopyPrompt = async (prompt: string) => {
    try {
      await navigator.clipboard.writeText(prompt)
      setCopiedPrompt(prompt)
      setTimeout(() => setCopiedPrompt(null), 2000)
    } catch (err) {
      console.error('Failed to copy prompt:', err)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8 bg-background text-foreground">
      {showSetupWizard && !isMobile ? (
        <SetupWizard
          onSetupComplete={() => {
            setIsSetupRequired(false)
            setShowSetupWizard(false)
            fetchAllImages()
            checkSetupStatus()
          }}
        />
      ) : (
        <>
          {isSetupRequired && !isMobile && (
            <div className="text-center py-8">
              <p className="text-lg mb-4">セットアップが必要です。続行するには「開始」をクリックしてください。</p>
              <Button onClick={() => setShowSetupWizard(true)}>開始</Button>
            </div>
          )}

          <div className="flex flex-col md:flex-row items-center justify-between mb-6">
            <h1 className="text-3xl font-bold mb-4 md:mb-0">Sikority</h1>
            <div className="flex flex-wrap gap-2">
              {currentFolderPath && (
                <span className="bg-muted text-muted-foreground text-sm font-medium px-3 py-1 rounded-full">
                  現在のフォルダ: {currentFolderPath}
                </span>
              )}
              {!isMobile && (
                <Button onClick={() => setShowSetupWizard(true)} size="sm" variant="outline">
                  <FolderSync className="h-4 w-4 mr-2" />
                  フォルダ変更
                </Button>
              )}
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="evaluation">評価</TabsTrigger>
              {!isMobile && <TabsTrigger value="generation">生成</TabsTrigger>}
            </TabsList>
            <TabsContent value="evaluation" className="mt-4">
              {isSetupRequired && isMobile ? (
                <div className="text-center py-8 text-lg text-gray-600">
                  PCでSikorityのセットアップを完了してください。
                </div>
              ) : (
                <>
                  <div className="mb-4 flex flex-wrap gap-2">
                    <Button
                      onClick={() => setFilterCategory(null)}
                      variant={filterCategory === null ? "default" : "outline"}
                      size="sm"
                    >
                      すべて
                    </Button>
                    <Button
                      onClick={() => setFilterCategory("unclassified")}
                      variant={filterCategory === "unclassified" ? "default" : "outline"}
                      size="sm"
                    >
                      未分類
                    </Button>
                    <Button
                      onClick={() => setFilterCategory("S")}
                      variant={filterCategory === "S" ? "default" : "outline"}
                      size="sm"
                    >
                      S
                    </Button>
                    <Button
                      onClick={() => setFilterCategory("A")}
                      variant={filterCategory === "A" ? "default" : "outline"}
                      size="sm"
                    >
                      A
                    </Button>
                    <Button
                      onClick={() => setFilterCategory("B")}
                      variant={filterCategory === "B" ? "default" : "outline"}
                      size="sm"
                    >
                      B
                    </Button>
                    <Button
                      onClick={() => setFilterCategory("C")}
                      variant={filterCategory === "C" ? "default" : "outline"}
                      size="sm"
                    >
                      C
                    </Button>
                    <Button
                      onClick={() => setFilterCategory("D")}
                      variant={filterCategory === "D" ? "default" : "outline"}
                      size="sm"
                    >
                      D
                    </Button>
                    <Button
                      onClick={() => setFilterCategory("deleted")}
                      variant={filterCategory === "deleted" ? "default" : "outline"}
                      size="sm"
                    >
                      削除済み
                    </Button>
                    {filterCategory === "deleted" && images.length > 0 && (
                      <Button
                        onClick={() => setShowDeleteConfirm(true)}
                        variant="destructive"
                        size="sm"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        すべて削除
                      </Button>
                    )}
                  </div>

                  {loading && <p>読み込み中...</p>}
                  {error && <p className="bg-destructive/10 border border-destructive text-destructive-foreground px-4 py-3 rounded">エラー: {error}</p>}
                  {!loading && !error && images.length === 0 && (
                    <p>画像が見つかりませんでした。</p>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {images.map((image, index) => (
                      <div key={`${image.category}-${image.filename}`} className="border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                        <div 
                          className="flex items-center justify-center h-64 sm:h-80 md:h-96 bg-card rounded mb-4 cursor-pointer hover:bg-accent transition-colors"
                          onClick={() => {
                            setSelectedImage(`${BASE_URL}${image.path}`)
                            setSelectedImageIndex(index)
                            setSelectedImageFilename(image.filename) // ファイル名を保存
                          }}
                        >
                          <img
                            src={`${BASE_URL}${image.path}`}
                            alt={image.filename}
                            className="max-w-full max-h-full object-contain"
                          />
                        </div>
                        <div className="flex flex-col gap-2">
                          <div className="flex justify-between items-center">
                            <div className="flex gap-2">
                              {image.category === 'unclassified' ? (
                                <>
                                  {['S', 'A', 'B', 'C', 'D'].map((rating) => (
                                    <Button
                                      key={rating}
                                      onClick={() => handleClassify(image.filename, rating)}
                                      variant="ghost"
                                      className={`${ratingColors[rating as keyof typeof ratingColors]} text-white`}
                                    >
                                      {rating}
                                    </Button>
                                  ))}
                                </>
                              ) : image.category === 'deleted' ? (
                                <div className="flex gap-2">
                                  <Button
                                    variant="outline"
                                    onClick={() => handleRestore(image.filename)}
                                    className="flex items-center gap-2"
                                  >
                                    <Archive className="h-4 w-4" />
                                    復元
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    onClick={() => handleDelete(image.filename, 'deleted')}
                                    className="flex items-center gap-2"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                    完全に削除
                                  </Button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <Button
                                    className={`${ratingColors[image.category as keyof typeof ratingColors]} text-white text-xl px-6 py-2`}
                                  >
                                    {image.category}
                                  </Button>
                                  <div className="flex gap-1">
                                    {['S', 'A', 'B', 'C', 'D'].map((rating) => (
                                      <Button
                                        key={rating}
                                        onClick={() => handleClassify(image.filename, rating)}
                                        className={`${ratingColors[rating as keyof typeof ratingColors]} text-white`}
                                        variant="outline"
                                        size="sm"
                                      >
                                        {rating}
                                      </Button>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                            {image.category !== 'deleted' && (
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => handleDelete(image.filename, image.category)}
                                  className="text-gray-500 hover:text-gray-700"
                                >
                                  <Archive className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                          </div>
                          {image.category !== 'unclassified' && (
                            <div className="absolute top-2 right-2">
                              <CheckCircle2 className="h-6 w-6 text-green-500" />
                            </div>
                          )}
                          {image.metadata && Object.keys(image.metadata).length > 0 && (
                            <div className="text-xs text-foreground mt-2 p-2 bg-muted rounded break-all">
                              <h4 className="font-semibold mb-1">メタデータ:</h4>
                              {image.metadata.parameters && (
                                <div className="mb-2">
                                  <h5 className="font-bold text-sm">プロンプト:</h5>
                                  <div 
                                    className="relative group cursor-pointer"
                                    onClick={() => handleCopyPrompt(image.metadata.parameters.split('\n')[0])}
                                  >
                                    <pre className="whitespace-pre-wrap overflow-x-auto text-sm bg-accent/50 p-2 rounded hover:bg-muted transition-colors">
                                      {image.metadata.parameters.split('\n')[0]}
                                    </pre>
                                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                      {copiedPrompt === image.metadata.parameters.split('\n')[0] ? (
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
                                  {image.metadata.parameters.split('\n').some((line: string) => line.startsWith('Negative prompt:')) && (
                                    <>
                                      <h5 className="font-bold text-sm mt-2">ネガティブプロンプト:</h5>
                                      <div 
                                        className="relative group cursor-pointer"
                                        onClick={() => handleCopyPrompt(image.metadata.parameters.split('\n').find((line: string) => line.startsWith('Negative prompt:'))?.replace('Negative prompt:', '').trim() || '')}
                                      >
                                        <pre className="whitespace-pre-wrap overflow-x-auto text-sm bg-accent/50 p-2 rounded hover:bg-muted transition-colors">
                                          {image.metadata.parameters.split('\n').find((line: string) => line.startsWith('Negative prompt:'))?.replace('Negative prompt:', '').trim()}
                                        </pre>
                                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                          {copiedPrompt === image.metadata.parameters.split('\n').find((line: string) => line.startsWith('Negative prompt:'))?.replace('Negative prompt:', '').trim() ? (
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
                                  <h5 className="font-bold text-sm mt-2">生成パラメータ:</h5>
                                  <div className="text-foreground">
                                    {image.metadata.parameters.split('\n')
                                      .filter((line: string) => !line.startsWith('Negative prompt:'))
                                      .slice(1)
                                      .map((line: string, index: number) => (
                                        <div key={index} className="mb-1">
                                          {line.split(', ').map((param: string, paramIndex: number) => (
                                            <span key={paramIndex} className="mr-2">
                                              {param}
                                            </span>
                                          ))}
                                        </div>
                                      ))}
                                  </div>
                                </div>
                              )}
                              {Object.entries(image.metadata).map(([key, value]) => {
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
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </TabsContent>
            {!isMobile && (
              <TabsContent value="generation">
                <ImageGenerator onImageGenerated={() => fetchAllImages()} />
              </TabsContent>
            )}
          </Tabs>
        </>
      )}
      {selectedImage && (
        <ImageModal
          imageUrl={selectedImage}
          onClose={() => {
            setSelectedImage(null)
            setSelectedImageIndex(null)
            setSelectedImageFilename(null)
          }}
          onNext={handleNextImage}
          onPrevious={handlePreviousImage}
          metadata={selectedImageFilename ? allImages.find(img => img.filename === selectedImageFilename)?.metadata : null}
          isMobile={isMobile}
        />
      )}

      {/* 削除確認ダイアログ */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmDeleteAll ? "すべての削除済み画像を完全に削除しますか？" : 
               confirmDeleteFilename ? `本当にこの画像「${confirmDeleteFilename}」を削除しますか？` : 
               `本当にこの画像「${confirmRestoreFilename}」を復元しますか？`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDeleteAll ? "この操作は元に戻せません。すべての削除済み画像が完全に消去されます。" : 
               confirmDeleteFilename ? "この操作は画像ファイルを削除済みフォルダに移動します。" : 
               "この操作は画像ファイルを未分類フォルダに復元します。"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              キャンセル
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmDeleteAll) {
                  executeDeleteAll()
                } else if (confirmDeleteFilename && confirmDeleteCategory) {
                  executeDelete(confirmDeleteFilename, confirmDeleteCategory)
                } else if (confirmRestoreFilename) {
                  executeRestore(confirmRestoreFilename)
                }
              }}
              className={confirmDeleteAll ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}
            >
              {confirmDeleteAll ? "完全に削除" : 
               confirmDeleteFilename ? "削除" : 
               "復元"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default App 