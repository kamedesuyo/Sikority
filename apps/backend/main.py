from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pathlib import Path
import json
import shutil
import os
from typing import List, Dict, Union, Optional
import requests
import base64
import time
import asyncio
import platform
from pydantic import BaseModel

# Windows環境でasyncioのイベントループポリシーを設定
if platform.system() == "Windows":
    asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())

# parse_metadata.pyからextract_metadata関数を直接インポート
# プロジェクトルートからの相対パスでインポート
import importlib.util
import sys

# プロジェクトルートのパスを取得
project_root = Path(__file__).parent.parent.parent
scripts_dir = project_root / "scripts"
parse_metadata_path = scripts_dir / "parse_metadata.py"

# モジュールを動的にインポート
spec = importlib.util.spec_from_file_location("parse_metadata", parse_metadata_path)
parse_metadata = importlib.util.module_from_spec(spec)
sys.modules["parse_metadata"] = parse_metadata
spec.loader.exec_module(parse_metadata)

# extract_metadata関数を直接参照
extract_metadata = parse_metadata.extract_metadata

# モデル関連の型定義
class Model(BaseModel):
    id: str
    name: str
    path: str
    description: Optional[str] = None

class SetupFolderRequest(BaseModel):
    folder_path: str

# 画像生成リクエストの型定義を追加
class GenerateImageRequest(BaseModel):
    prompt: str
    negative_prompt: str = ""
    width: int = 512
    height: int = 512
    steps: int = 20
    cfg_scale: float = 7.0
    sampler_name: str = "Euler a"
    seed: int = -1
    model_id: Optional[str] = None

# FastAPIアプリケーションの初期化
app = FastAPI(title="Sikority API")

# CORSの設定
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # フロントエンドのURLを指定
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 設定ファイルのパスとグローバル設定変数
current_dir = Path(__file__).parent
project_root = current_dir.parent.parent
config_file_path = project_root / "config" / "default.json"
config = {}

def load_config():
    global config
    with open(config_file_path, "r", encoding="utf-8") as f:
        config.clear()
        config.update(json.load(f))

def save_config():
    with open(config_file_path, "w", encoding="utf-8") as f:
        json.dump(config, f, indent=2, ensure_ascii=False)

# 初期設定のロード
load_config()

def get_unclassified_dir_path() -> Path:
    path_str = config.get("paths", {}).get("unclassified")
    if not path_str:
        # 設定されていない場合、デフォルトのパスを返すかエラー
        # ここでは初回起動設定なので、Noneを返す代わりにエラーを発生させます
        raise ValueError("Unclassified path is not set in config.")
    
    # パスが絶対パスでなければプロジェクトルートからの相対パスとして扱う
    target_path = Path(path_str)
    if not target_path.is_absolute():
        return project_root / target_path
    return target_path

def get_classified_dir_path(rating: str) -> Path:
    path_str = config.get("paths", {}).get("classified", {}).get(rating)
    if not path_str:
        # 分類済みパスが設定されていない場合は、未分類フォルダの下に作成を試みる
        return get_unclassified_dir_path() / "classified" / rating
    
    target_path = Path(path_str)
    if not target_path.is_absolute():
        return project_root / target_path
    return target_path

def get_deleted_dir_path() -> Path:
    """削除済み画像用のディレクトリパスを取得"""
    path_str = config.get("paths", {}).get("deleted")
    if not path_str:
        # 設定されていない場合は、未分類フォルダの下に作成
        return get_unclassified_dir_path() / "deleted"
    
    target_path = Path(path_str)
    if not target_path.is_absolute():
        return project_root / target_path
    return target_path

# 静的ファイルサービングの削除
# app.mount("/images", StaticFiles(directory=str(public_dir / "images")), name="images")

@app.get("/")
async def root():
    """ルートエンドポイント"""
    return {"message": "Sikority API is running"}

@app.get("/api/status")
async def get_status():
    unclassified_path_set = False
    unclassified_path_exists = False
    unclassified_path_str = config.get("paths", {}).get("unclassified")
    current_unclassified_path = None

    if unclassified_path_str:
        unclassified_path_set = True
        try:
            path = get_unclassified_dir_path()
            unclassified_path_exists = path.is_dir()
            current_unclassified_path = str(path)
        except ValueError:
            unclassified_path_exists = False # パスが不正な場合
            
    return {
        "unclassified_path_set": unclassified_path_set,
        "unclassified_path_exists": unclassified_path_exists,
        "unclassified_path": current_unclassified_path,
    }

@app.post("/api/setup-unclassified-folder")
async def setup_unclassified_folder(request: SetupFolderRequest):
    folder_path = request.folder_path
    try:
        new_unclassified_abs_path = Path(folder_path).resolve()
        
        if not new_unclassified_abs_path.is_dir():
            raise HTTPException(status_code=400, detail=f"指定されたパスはディレクトリではありません、または存在しません: {folder_path}")
        
        # 設定を更新して保存
        config["paths"]["unclassified"] = str(new_unclassified_abs_path)
        save_config()
        
        # 分類済みフォルダが存在しない場合は作成
        for rating in ["S", "A", "B", "C", "D"]:
            classified_folder = get_classified_dir_path(rating)
            classified_folder.mkdir(parents=True, exist_ok=True)

        return {"message": "未分類フォルダが設定されました。サーバーを再起動してください。"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/images")
async def get_images(category: Optional[str] = None) -> List[Dict]:
    """未分類画像と分類済み画像の一覧を取得（フィルター可能）"""
    all_images = []

    # 未分類画像の取得
    try:
        unclassified_path = get_unclassified_dir_path()
        unclassified_path.mkdir(parents=True, exist_ok=True)
        for img_path in unclassified_path.glob("*.png"):
            all_images.append({
                "filename": img_path.name,
                "path": f"/api/serve-image/unclassified/{img_path.name}",
                "created_at": img_path.stat().st_mtime,
                "category": "unclassified",
                "metadata": {}
            })
    except ValueError as e:
        print(f"Warning: {e}", file=sys.stderr)

    # 分類済み画像の取得
    for rating in ["S", "A", "B", "C", "D"]:
        try:
            classified_path = get_classified_dir_path(rating)
            classified_path.mkdir(parents=True, exist_ok=True)
            for img_path in classified_path.glob("*.png"):
                all_images.append({
                    "filename": img_path.name,
                    "path": f"/api/serve-image/{rating}/{img_path.name}",
                    "created_at": img_path.stat().st_mtime,
                    "category": rating,
                    "metadata": {}
                })
        except ValueError as e:
            print(f"Warning: {e}", file=sys.stderr)

    # 削除済み画像の取得
    try:
        deleted_path = get_deleted_dir_path()
        deleted_path.mkdir(parents=True, exist_ok=True)
        for img_path in deleted_path.glob("*.png"):
            all_images.append({
                "filename": img_path.name,
                "path": f"/api/serve-image/deleted/{img_path.name}",
                "created_at": img_path.stat().st_mtime,
                "category": "deleted",
                "metadata": {}
            })
    except ValueError as e:
        print(f"Warning: {e}", file=sys.stderr)

    # メタデータの並行取得とフィルタリング
    results = await asyncio.gather(*[
        get_image_metadata_safe(img["filename"], img["category"])
        for img in all_images
    ])
    
    for i, res in enumerate(results):
        if "error" not in res:
            all_images[i]["metadata"] = res
        else:
            print(f"Error fetching metadata for {all_images[i]["filename"]}: {res["error"]}", file=sys.stderr)
            all_images[i]["metadata"] = {"error": res["error"]}

    # フィルタリング
    if category:
        filtered_images = [img for img in all_images if img["category"].lower() == category.lower()]
    else:
        filtered_images = all_images
    
    return sorted(filtered_images, key=lambda x: x["created_at"], reverse=True)

@app.post("/api/classify/{filename}")
async def classify_image(filename: str, rating: str):
    """画像を分類する（再評価にも対応）"""
    if rating not in ["S", "A", "B", "C", "D"]:
        raise HTTPException(status_code=400, detail="Invalid rating")
    
    try:
        # 画像を探す（未分類フォルダと分類済みフォルダの両方を確認）
        source_path = None
        current_category = None
        
        # 未分類フォルダを確認
        unclassified_path = get_unclassified_dir_path() / filename
        if unclassified_path.exists():
            source_path = unclassified_path
            current_category = "unclassified"
        
        # 分類済みフォルダを確認
        if not source_path:
            for cat in ["S", "A", "B", "C", "D"]:
                classified_path = get_classified_dir_path(cat) / filename
                if classified_path.exists():
                    source_path = classified_path
                    current_category = cat
                    break
        
        if not source_path:
            raise HTTPException(status_code=404, detail="Image not found in any folder")
        
        # 同じカテゴリへの再分類は無視
        if current_category == rating:
            return {"message": f"Image is already classified as {rating}"}
        
        # 移動先のパスを設定
        target_dir = get_classified_dir_path(rating)
        target_path = target_dir / filename
        
        target_dir.mkdir(parents=True, exist_ok=True)
        
        try:
            shutil.move(str(source_path), str(target_path))
            return {"message": f"Image classified as {rating}"}
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
            
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.delete("/api/images/{filename}")
async def delete_image(filename: str, category: str = "unclassified"):
    """画像を削除済みフォルダに移動する"""
    source_path: Path
    try:
        if category.lower() == "unclassified":
            source_path = get_unclassified_dir_path() / filename
            original_category = "unclassified"
        elif category.upper() in ["S", "A", "B", "C", "D"]:
            source_path = get_classified_dir_path(category.upper()) / filename
            original_category = category.upper()
        elif category.lower() == "deleted":
            # 削除済みフォルダからの削除は完全に削除
            source_path = get_deleted_dir_path() / filename
            if not source_path.exists():
                raise HTTPException(status_code=404, detail="Image not found in deleted folder")
            try:
                os.remove(source_path)
                return {"message": "Image permanently deleted"}
            except Exception as e:
                raise HTTPException(status_code=500, detail=str(e))
        else:
            raise HTTPException(status_code=400, detail="Invalid category for deletion")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    if not source_path.exists():
        raise HTTPException(status_code=404, detail="Image not found in specified category folder")
    
    try:
        # 削除済みフォルダに移動
        deleted_dir = get_deleted_dir_path()
        deleted_dir.mkdir(parents=True, exist_ok=True)
        target_path = deleted_dir / filename
        
        # 同名ファイルが存在する場合は、タイムスタンプを付加
        if target_path.exists():
            timestamp = int(time.time())
            name, ext = filename.rsplit('.', 1)
            target_path = deleted_dir / f"{name}_{timestamp}.{ext}"
        
        # 元のカテゴリ情報をメタデータとして保存
        metadata_path = target_path.with_suffix('.json')
        with open(metadata_path, 'w', encoding='utf-8') as f:
            json.dump({
                'original_category': original_category,
                'deleted_at': int(time.time())
            }, f, ensure_ascii=False)
        
        shutil.move(str(source_path), str(target_path))
        return {"message": "Image moved to deleted folder"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/models", response_model=List[Model])
async def get_models():
    """利用可能なモデルの一覧を取得するAPIエンドポイント"""
    try:
        models = get_available_models()
        print(f"APIレスポンス: {models}")  # デバッグログ
        return models
    except Exception as e:
        print(f"モデル取得エラー: {str(e)}")  # デバッグログ
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/generate-image")
async def generate_image(request: GenerateImageRequest):
    """Stable Diffusionで画像を生成し、保存する"""
    # モデルが指定されている場合、選択されたモデルのパスをペイロードに含める
    selected_model_path: Optional[str] = None
    if request.model_id:
        models = get_available_models()
        selected_model = next((m for m in models if m.id == request.model_id), None)
        if not selected_model:
            raise HTTPException(status_code=400, detail=f"指定されたモデルが見つかりません: {request.model_id}")
        selected_model_path = selected_model.path

    # Automatic1111のtxt2imgエンドポイントURL
    sd_api_url = f"{config['api']['automatic1111']['base_url']}{config['api']['automatic1111']['endpoints']['txt2img']}"
    
    payload = {
        "prompt": request.prompt,
        "negative_prompt": request.negative_prompt,
        "width": request.width,
        "height": request.height,
        "steps": request.steps,
        "cfg_scale": request.cfg_scale,
        "sampler_name": request.sampler_name,
        "seed": request.seed,
    }
    
    # モデルパスが選択されていればペイロードに追加
    if selected_model_path:
        # Automatic1111 APIが期待するモデルパスの形式に合わせて調整が必要な場合があります
        # artist_classfileの例に従い、ここでmodelキーを追加します。
        # 注意: Automatic1111が相対パスを正しく解釈するかはAutomatic1111の設定に依存します。
        # 必要であれば、完全な絶対パスを渡すように変更することも検討します。
        payload["override_settings"] = {"sd_model_checkpoint": selected_model_path}
        print(f"DEBUG: Automatic1111へ送信するモデル切り替えペイロード (override_settings): {payload["override_settings"]}")
    
    try:
        response = requests.post(sd_api_url, json=payload)
        response.raise_for_status()
        
        result = response.json()
        if "images" not in result or not result["images"]:
            raise HTTPException(status_code=500, detail="No image found in Stable Diffusion response")
            
        # 最初の画像をデコードして保存
        img_data = base64.b64decode(result["images"][0])
        
        try:
            output_dir = get_unclassified_dir_path()
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))

        output_dir.mkdir(parents=True, exist_ok=True)
        
        filename = f"generated_{int(time.time())}.png"
        image_path = output_dir / filename
        
        with open(image_path, "wb") as f:
            f.write(img_data)
            
        return {"filename": filename, "path": f"/api/serve-image/unclassified/{filename}", "category": "unclassified"}
        
    except requests.exceptions.ConnectionError:
        raise HTTPException(status_code=503, detail="AUTOMATIC1111 APIに接続できません。APIサーバーが起動しているか確認してください。")
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=500, detail=f"Stable Diffusion APIエラー: {e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"画像生成中にエラーが発生しました: {e}")

async def get_image_metadata_safe(filename: str, category: str): 
    image_path: Path
    try:
        if category.lower() == "unclassified":
            image_path = get_unclassified_dir_path() / filename
        elif category.upper() in ["S", "A", "B", "C", "D"]:
            image_path = get_classified_dir_path(category.upper()) / filename
        else:
            return {"error": "Invalid category for metadata retrieval"}
    except ValueError as e:
        return {"error": str(e)}
    
    if not image_path.exists():
        return {"error": "Image not found"}
    
    try:
        # subprocessの代わりに直接extract_metadataを呼び出す
        metadata = extract_metadata(image_path)
        return metadata
    except Exception as e:
        # extract_metadata内でエラーがプリントされるため、ここでは詳細を省略
        return {"error": f"Failed to extract metadata: {e}"}

@app.get("/api/images/{filename}/metadata") # 既存のメタデータAPIは残す（不要なら削除）
async def get_image_metadata(filename: str):
    # このエンドポイントは未使用になるが、残しておいても良い。
    # フロントエンドは直接このAPIを呼ばず、get_imagesからメタデータを取得する
    # カテゴリ指定なしでunclassifiedから探す
    try:
        image_path = get_unclassified_dir_path() / filename
    except ValueError as e:
        print(f"Error: {e}", file=sys.stderr)
        return {"error": str(e)}
    
    if not image_path.exists():
        found_in_classified = False
        for rating in ["S", "A", "B", "C", "D"]:
            try:
                classified_path = get_classified_dir_path(rating) / filename
                if classified_path.exists():
                    image_path = classified_path
                    found_in_classified = True
                    break
            except ValueError:
                continue
        
        if not found_in_classified:
            return {"error": "Image not found"}
    
    try:
        metadata = extract_metadata(image_path) # 直接呼び出し
        return metadata
    except Exception as e:
        print(f"Failed to process metadata for {filename}: {e}", file=sys.stderr)
        return {"error": f"メタデータ抽出エラー: {e}"}

@app.get("/api/serve-image/{image_type}/{filename}")
async def serve_image(image_type: str, filename: str):
    """画像ファイルを提供する"""
    try:
        if image_type == "unclassified":
            image_path = get_unclassified_dir_path() / filename
        elif image_type in ["S", "A", "B", "C", "D"]:
            image_path = get_classified_dir_path(image_type) / filename
        elif image_type == "deleted":
            image_path = get_deleted_dir_path() / filename
        else:
            raise HTTPException(status_code=400, detail="Invalid image type")
        
        if not image_path.exists():
            raise HTTPException(status_code=404, detail="Image not found")
        
        return FileResponse(image_path)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/restore/{filename}")
async def restore_image(filename: str):
    """削除済み画像を元のフォルダに復元する"""
    try:
        source_path = get_deleted_dir_path() / filename
        if not source_path.exists():
            raise HTTPException(status_code=404, detail="Image not found in deleted folder")
        
        # メタデータから元のカテゴリを取得
        metadata_path = source_path.with_suffix('.json')
        original_category = "unclassified"  # デフォルトは未分類
        
        if metadata_path.exists():
            try:
                with open(metadata_path, 'r', encoding='utf-8') as f:
                    metadata = json.load(f)
                    original_category = metadata.get('original_category', 'unclassified')
            except Exception as e:
                print(f"Error reading metadata: {e}", file=sys.stderr)
        
        # 元のカテゴリのフォルダに移動
        if original_category == "unclassified":
            target_dir = get_unclassified_dir_path()
        else:
            target_dir = get_classified_dir_path(original_category)
        
        target_path = target_dir / filename
        
        # 同名ファイルが存在する場合は、タイムスタンプを付加
        if target_path.exists():
            timestamp = int(time.time())
            name, ext = filename.rsplit('.', 1)
            target_path = target_dir / f"{name}_{timestamp}.{ext}"
        
        # 画像を移動
        shutil.move(str(source_path), str(target_path))
        
        # メタデータファイルを削除
        if metadata_path.exists():
            try:
                os.remove(metadata_path)
            except Exception as e:
                print(f"Error removing metadata file: {e}", file=sys.stderr)
        
        return {"message": f"Image restored to {original_category} folder"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/deleted")
async def delete_all_deleted():
    """削除済みフォルダ内の全画像を完全に削除する"""
    try:
        deleted_dir = get_deleted_dir_path()
        if not deleted_dir.exists():
            return {"message": "No deleted images found"}
        
        # 削除済みフォルダ内の全画像を削除
        for img_path in deleted_dir.glob("*.png"):
            try:
                os.remove(img_path)
            except Exception as e:
                print(f"Error deleting {img_path}: {e}", file=sys.stderr)
                continue
        
        return {"message": "All deleted images have been permanently removed"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def get_available_models() -> List[Model]:
    """利用可能なモデルの一覧を取得"""
    # プロジェクトルートからの相対パスでモデルディレクトリを指定
    models_dir = Path("C:/Users/toshi/AppData/Roaming/StabilityMatrix/Models/StableDiffusion")
    print(f"プロジェクトルート: {project_root}")  # デバッグログ
    print(f"モデルディレクトリのパス: {models_dir}")  # デバッグログ
    print(f"モデルディレクトリの存在確認: {models_dir.exists()}")  # デバッグログ
    
    if not models_dir.exists():
        print(f"モデルディレクトリが存在しません: {models_dir}")  # デバッグログ
        return []
    
    # モデルID（ディレクトリ名）ごとに一意のモデルを保持するための辞書
    unique_models: Dict[str, Model] = {}

    for model_dir in models_dir.iterdir():
        print(f"検索中のディレクトリ: {model_dir}")  # デバッグログ
        print(f"ディレクトリかどうか: {model_dir.is_dir()}")  # デバッグログ
        
        if not model_dir.is_dir():
            continue
            
        print(f"モデルディレクトリを検索中: {model_dir}")  # デバッグログ
        
        # モデルディレクトリ内のモデルファイルを探す（.safetensorsと.checkpoint）
        model_files = []
        model_files.extend(model_dir.glob("*.safetensors"))
        model_files.extend(model_dir.glob("*.checkpoint"))
        print(f"見つかったモデルファイル: {model_files}")  # デバッグログ
        
        if model_files:
            # ファイルの更新日時でソートして最新のものを取得
            latest_model = max(model_files, key=lambda x: x.stat().st_mtime)
            print(f"最新のモデルファイル: {latest_model}")  # デバッグログ
            
            model_id = model_dir.name # 各ディレクトリ名をモデルIDとして使用
            model_name = model_dir.name.capitalize()
            model_path = str(latest_model.relative_to(models_dir))
            
            # ファイルの種類に応じて説明を追加
            file_type = "Safetensors" if latest_model.suffix == ".safetensors" else "Checkpoint"
            
            # 辞書に追加（同じIDがあれば上書きされるため、重複が排除される）
            unique_models[model_id] = Model(
                id=model_id,
                name=model_name,
                path=model_path,
                description=f"{model_name}モデル ({file_type})"
            )
    
    # 辞書の値（Modelオブジェクト）のリストを返す
    result_models = list(unique_models.values())
    print(f"見つかったモデル数 (重複排除後): {len(result_models)}")  # デバッグログ
    print(f"見つかったモデル一覧 (重複排除後): {result_models}")  # デバッグログ
    return result_models

if __name__ == "__main__":
    import uvicorn
    print(f"サーバー起動: http://{config['server']['host']}:{config['server']['port']}")
    uvicorn.run(app, host=config["server"]["host"], port=config["server"]["port"]) 