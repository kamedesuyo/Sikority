#!/usr/bin/env python3
"""
画像ファイルからメタデータを抽出するスクリプト
"""

import json
import sys
from pathlib import Path
from typing import Dict, Optional
from PIL import Image
import piexif

def extract_metadata(image_path: Path) -> Dict:
    """
    画像ファイルからメタデータを抽出する
    
    Args:
        image_path (Path): 画像ファイルのパス
        
    Returns:
        Dict: 抽出したメタデータ
    """
    metadata = {
        "image_path": str(image_path)
    }
    
    try:
        with Image.open(image_path) as img:
            # PNGのtEXtチャンクからメタデータを抽出
            if 'parameters' in img.info:
                metadata['parameters'] = img.info['parameters']
            
            # EXIFデータの抽出
            if 'exif' in img.info:
                try:
                    exif_dict = piexif.load(img.info['exif'])
                    # EXIFデータをJSONシリアライズ可能な形式に変換
                    serializable_exif = {}
                    for ifd_name in exif_dict:
                        serializable_exif[ifd_name] = {
                            key: (value.decode('utf-8') if isinstance(value, bytes) else value)
                            for key, value in exif_dict[ifd_name].items()
                        }
                    metadata['exif'] = serializable_exif
                except Exception as exif_e:
                    print(f"Warning: Could not load EXIF data from {image_path}: {exif_e}", file=sys.stderr)

            # その他のPIL情報
            for key, value in img.info.items():
                if key not in metadata and not isinstance(value, (bytes, bytearray)): # バイナリデータは除外
                    metadata[key] = value
                
    except Exception as e:
        print(f"Error extracting metadata from {image_path}: {e}", file=sys.stderr)
        
    return metadata 