# 🎨 Sikority

**AI 生成画像の管理・評価・生成システム**

Stable Diffusion（AUTOMATIC1111 WebUI）で生成した画像の効率的な管理と品質評価を行う Web アプリケーションです。

![Sikority Logo](https://img.shields.io/badge/Sikority-v0.1.0-blue.svg)
![React](https://img.shields.io/badge/React-18.2.0-61DAFB.svg)
![Python](https://img.shields.io/badge/Python-3.8+-3776AB.svg)
![FastAPI](https://img.shields.io/badge/FastAPI-Latest-009688.svg)

## 📋 概要

Sikority は、AI 生成画像のライフサイクル全体をサポートする包括的な管理システムです。画像の生成から評価、分類、アーカイブまでを一元的に管理し、効率的なワークフローを提供します。

### 🎯 主要な特徴

- **🖼️ 直感的な画像管理**: グリッド表示とカテゴリフィルタリング
- **⭐ 5 段階品質評価**: S（最高）から D（低品質）までの分類システム
- **🎨 統合画像生成**: AUTOMATIC1111 WebUI との完全連携
- **📱 モバイル対応**: スマートフォン・タブレットからの評価作業
- **🔄 リアルタイム同期**: PC・モバイル間でのデータ同期
- **🗂️ 安全な削除システム**: ソフト削除と復元機能

## ✨ 実装済み機能

### 🖼️ 画像管理

| 機能                         | 説明                       | 対応デバイス |
| ---------------------------- | -------------------------- | ------------ |
| **画像一覧表示**             | レスポンシブなグリッド表示 | PC・モバイル |
| **カテゴリフィルタリング**   | 未分類/S/A/B/C/D/削除済み  | PC・モバイル |
| **5 段階品質評価**           | ワンクリック分類システム   | PC・モバイル |
| **画像拡大・ナビゲーション** | キーボード・マウス操作対応 | PC・モバイル |
| **メタデータ表示**           | プロンプト・生成パラメータ | PC・モバイル |
| **削除・復元機能**           | 安全なアーカイブシステム   | PC・モバイル |

### 🎨 画像生成

| 機能                       | 説明                     | 対応デバイス |
| -------------------------- | ------------------------ | ------------ |
| **txt2img 生成**           | プロンプトベース画像生成 | PC のみ      |
| **パラメータ制御**         | サイズ・ステップ・CFG 等 | PC のみ      |
| **モデル選択**             | 利用可能モデルの動的取得 | PC のみ      |
| **リアルタイムプレビュー** | 生成結果の即座表示       | PC のみ      |

### ⚙️ システム機能

- **初期セットアップ**: 未分類フォルダの自動設定
- **動的設定変更**: 実行時のフォルダパス変更
- **マルチデバイス対応**: ネットワーク経由でのアクセス
- **エラーハンドリング**: 堅牢なエラー処理とリトライ機能

## 🛠️ 技術スタック

### フロントエンド

- **React 18** + **TypeScript**: モダンな UI 開発
- **Tailwind CSS**: ユーティリティファースト CSS
- **shadcn/ui**: 高品質 UI コンポーネント
- **Vite**: 高速ビルドツール

### バックエンド

- **Python 3.8+**: 安定したバックエンド基盤
- **FastAPI**: 高性能非同期 Web フレームワーク
- **Pillow**: 画像処理ライブラリ
- **ExifTool**: メタデータ抽出

### 外部連携

- **AUTOMATIC1111 WebUI**: Stable Diffusion API
- **StabilityMatrix**: モデル管理システム

## 📦 必要条件

### システム要件

- **OS**: Windows 10/11, macOS, Linux
- **Python**: 3.8 以上
- **Node.js**: 18 以上
- **メモリ**: 8GB 以上推奨
- **ストレージ**: 10GB 以上の空き容量

### 必須ソフトウェア

- **AUTOMATIC1111 WebUI**: ローカルで起動・API 有効化
- **StabilityMatrix**: モデル管理（推奨）

## 🚀 クイックスタート

### 1. インストール

```bash
# リポジトリクローン
git clone https://github.com/your-username/Sikority.git
cd Sikority

# 自動インストール（Windows）
install.cmd

# または手動インストール
npm install
pip install -r apps/backend/requirements.txt
```

### 2. AUTOMATIC1111 設定

```bash
# WebUI起動時に--apiフラグを追加
python launch.py --api
```

### 3. アプリケーション起動

```bash
# 自動起動（Windows）
run.cmd

# または手動起動
# ターミナル1: バックエンド
cd apps/backend && python main.py

# ターミナル2: フロントエンド
npm run dev
```

### 4. 初期設定

1. ブラウザで `http://localhost:5173` にアクセス
2. セットアップウィザードで未分類フォルダを指定
3. 自動的に分類フォルダが作成されます

## 📱 モバイルアクセス

### PC 側設定

1. PC の IP アドレスを確認: `ipconfig`（Windows）/ `ifconfig`（Mac/Linux）
2. ファイアウォールでポート 5173、3000 を許可

### モバイル側アクセス

1. スマートフォンのブラウザで `http://[PC_IP]:5173` にアクセス
2. 評価機能のみ利用可能（生成機能は PC のみ）

## 🎯 使用方法

### 基本ワークフロー

```
1. 画像生成（PCのみ）
   ├─ プロンプト入力
   ├─ パラメータ調整
   ├─ モデル選択
   └─ 生成実行

2. 画像評価（PC・モバイル）
   ├─ 画像一覧確認
   ├─ 拡大表示・メタデータ確認
   ├─ 品質評価（S/A/B/C/D）
   └─ 必要に応じて削除

3. 画像管理
   ├─ カテゴリ別フィルタリング
   ├─ 削除済み画像の復元
   └─ アーカイブ管理
```

### 画像分類システム

| 評価  | 説明     | 用途             |
| ----- | -------- | ---------------- |
| **S** | 最高品質 | 作品集・公開用   |
| **A** | 高品質   | 参考画像・保存用 |
| **B** | 標準品質 | 一般的な品質     |
| **C** | 低品質   | 改善が必要       |
| **D** | 最低品質 | 削除候補         |

## 📁 ディレクトリ構造

```
Sikority/
├── apps/
│   ├── frontend/           # React フロントエンド
│   │   ├── src/
│   │   │   ├── components/ # UIコンポーネント
│   │   │   ├── types/      # TypeScript型定義
│   │   │   └── App.tsx     # メインアプリケーション
│   │   └── package.json
│   └── backend/            # Python バックエンド
│       ├── main.py         # FastAPI アプリケーション
│       └── requirements.txt
├── config/                 # 設定ファイル
│   ├── default.json        # システム設定
│   └── generation.json     # 生成設定
├── documents/              # プロジェクト文書
│   ├── architecture.md     # アーキテクチャ仕様
│   ├── feature-flows.md    # 機能フロー詳細
│   ├── dev-log.md         # 開発ログ
│   └── changelog.md       # 変更履歴
├── public/
│   └── images/            # 画像保存ディレクトリ
│       ├── unclassified/  # 未分類画像
│       ├── classified/    # 分類済み画像
│       │   ├── S/
│       │   ├── A/
│       │   ├── B/
│       │   ├── C/
│       │   └── D/
│       └── deleted/       # 削除済み画像
├── scripts/               # ユーティリティスクリプト
├── install.cmd           # 自動インストール
├── run.cmd              # 自動起動
└── README.md
```

## 🔧 設定

### システム設定（config/default.json）

```json
{
  "api": {
    "automatic1111": {
      "base_url": "http://127.0.0.1:7860",
      "endpoints": {
        "txt2img": "/sdapi/v1/txt2img"
      }
    }
  },
  "paths": {
    "unclassified": "path/to/unclassified",
    "classified": {
      "S": "path/to/S",
      "A": "path/to/A",
      "B": "path/to/B",
      "C": "path/to/C",
      "D": "path/to/D"
    }
  },
  "server": {
    "host": "0.0.0.0",
    "port": 3000
  }
}
```

## 🚨 トラブルシューティング

### よくある問題

#### AUTOMATIC1111 API 接続エラー

```bash
# 解決方法
1. WebUIが起動しているか確認
2. --apiフラグが有効か確認
3. ポート7860が使用可能か確認
```

#### モバイルからアクセスできない

```bash
# 解決方法
1. PCとモバイルが同じネットワークにいるか確認
2. ファイアウォール設定を確認
3. PCのIPアドレスが正しいか確認
```

#### セットアップが完了しない

```bash
# 解決方法
1. 指定フォルダの書き込み権限を確認
2. パスに日本語文字が含まれていないか確認
3. ディスク容量を確認
```

## 📚 詳細ドキュメント

- **[アーキテクチャ仕様](documents/architecture.md)**: システム全体の設計思想
- **[機能フロー詳細](documents/feature-flows.md)**: 各機能の処理フロー
- **[開発ログ](documents/dev-log.md)**: 開発の経緯と技術的決定
- **[変更履歴](documents/changelog.md)**: バージョン別の変更内容

## 🤝 コントリビューション

プロジェクトへの貢献を歓迎します！

1. このリポジトリをフォーク
2. 機能ブランチを作成: `git checkout -b feature/amazing-feature`
3. 変更をコミット: `git commit -m 'Add amazing feature'`
4. ブランチにプッシュ: `git push origin feature/amazing-feature`
5. プルリクエストを作成

## 📄 ライセンス

このプロジェクトは MIT ライセンスの下で公開されています。詳細は[LICENSE](LICENSE)ファイルを参照してください。

## 🙏 謝辞

- **AUTOMATIC1111**: Stable Diffusion WebUI
- **StabilityMatrix**: モデル管理システム
- **shadcn/ui**: 美しい UI コンポーネント
- **Tailwind CSS**: 効率的なスタイリング

---

**Sikority** - AI 生成画像の新しい管理体験を提供します。
