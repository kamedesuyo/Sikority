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

## 🐈 使用方法

- Sikority をクローン後 Sikority 内の install.cmd を起動し、終了を確認後 run.cmd を起動する。
- 自動で localhost:5173 に立ち上がります。スマホからは閲覧のみで ipad 等からは生成が可能。
