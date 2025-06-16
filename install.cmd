@echo off
echo === Installing dependencies ===

REM フロントエンドの依存関係インストール
echo -- Installing frontend dependencies --
cd apps\frontend
if exist package-lock.json (
    call npm ci
) else (
    call npm install
)
cd ../..

REM バックエンドの依存関係インストール（venvとpip）
echo -- Installing backend dependencies --
cd apps\backend

REM Python仮想環境の作成
if not exist venv (
    echo Creating virtual environment...
    python -m venv venv
)

call venv\Scripts\activate.bat

if exist requirements.txt (
    echo Installing from requirements.txt...
    pip install -r requirements.txt
) else (
    echo No requirements.txt found.
)

cd ../..

echo === All dependencies installed successfully ===
pause