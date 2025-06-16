# 🎨 Sikority

Stable Diffusion 画像の管理・評価システム

## 📋 概要

Sikority は、Stable Diffusion（AUTOMATIC1111 API）で生成した画像を管理・評価するための Web アプリケーションです。

## 🚀 主な機能

- 画像一覧表示
- 評価・分類（S/A/B/C/D）
- 画像削除
- 画像生成（txt2img）
- メタデータ解析

## 🛠️ 技術スタック

- フロントエンド：React + TypeScript + Tailwind + shadcn/ui
- バックエンド：Python (FastAPI)
- メタデータ処理：Python（Pillow, Pngmeta, ExifTool）

## 📦 必要条件

- Python 3.8 以上
- Node.js 18 以上
- AUTOMATIC1111 WebUI（ローカルで起動）

## 🏗️ プロジェクト構成

```
/sikority/
├─ apps/
│ ├─ frontend/（React + TypeScript）
│ └─ backend/（FastAPI）
├─ config/
│ └─ default.json
├─ scripts/
│ └─ parse_metadata.py
├─ public/
│ └─ images/
└─ documents/
    ├─ dev-log.md
    ├─ progress-*.md
    └─ changelog.md
```

## 🚀 開発環境のセットアップ

1. リポジトリのクローン

```bash
git clone [repository-url]
cd sikority
```

2. フロントエンドのセットアップ

```bash
cd apps/frontend
npm install
```

3. バックエンドのセットアップ

```bash
cd apps/backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

## 📝 開発ログ

開発の進捗は以下のファイルで管理しています：

- `documents/dev-log.md`: 開発ログ
- `documents/progress-*.md`: 日々の進捗
- `documents/changelog.md`: 変更履歴

## �� ライセンス

[ライセンス情報]
"# Sikority" 
