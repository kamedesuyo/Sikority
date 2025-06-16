import React, { useState } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'

interface SetupWizardProps {
  onSetupComplete: () => void
}

const SetupWizard: React.FC<SetupWizardProps> = ({ onSetupComplete }) => {
  const [folderPath, setFolderPath] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    try {
      const response = await fetch('http://localhost:3000/api/setup-unclassified-folder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ folder_path: folderPath }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'フォルダ設定に失敗しました')
      }
      setMessage('フォルダが正常に設定されました。サーバーを再起動してください。')
      // onSetupComplete(); // サーバー再起動が必要なため、自動リロードはしない
    } catch (err: any) {
      setError(err.message)
      console.error('フォルダ設定エラー:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-4 flex flex-col items-center justify-center min-h-screen">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center">未分類フォルダのセットアップ</h2>
        <p className="text-gray-600 mb-4 text-center">
          画像が保存されている未分類フォルダのパスを入力してください。
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="folderPath" className="block text-sm font-medium text-gray-700">フォルダパス</label>
            <Input
              id="folderPath"
              type="text"
              value={folderPath}
              onChange={(e) => setFolderPath(e.target.value)}
              placeholder="例: C:\Users\YourName\Pictures\UnclassifiedImages"
              required
              className="mt-1"
            />
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
          {message && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
              {message}
            </div>
          )}

          <Button type="submit" className="w-full mt-4" disabled={loading}>
            {loading ? '設定中...' : 'フォルダを設定'}
          </Button>
        </form>
        <p className="text-sm text-gray-500 mt-4 text-center">
          ※ フォルダ設定後、バックエンドサーバーを再起動してください。
        </p>
      </div>
    </div>
  )
}

export default SetupWizard 