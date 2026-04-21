"""
知识库文件管理模块
负责文件的存储、列表、下载、删除等功能
"""
import os
import json
import uuid
import shutil
from datetime import datetime
from typing import List, Dict, Optional
from pathlib import Path

# 文件存储根目录
FILES_ROOT = Path("./knowledge_files")
FILES_ROOT.mkdir(exist_ok=True)

# 元数据文件
METADATA_FILE = FILES_ROOT / "files_metadata.json"

def load_metadata() -> Dict:
    """加载文件元数据"""
    if METADATA_FILE.exists():
        with open(METADATA_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    return {"files": []}

def save_metadata(metadata: Dict):
    """保存文件元数据"""
    with open(METADATA_FILE, 'w', encoding='utf-8') as f:
        json.dump(metadata, f, ensure_ascii=False, indent=2)

def add_file_record(file_record: Dict):
    """添加文件记录"""
    metadata = load_metadata()
    metadata["files"].append(file_record)
    save_metadata(metadata)

def get_file_record(file_id: str) -> Optional[Dict]:
    """获取文件记录"""
    metadata = load_metadata()
    for file in metadata["files"]:
        if file["id"] == file_id:
            return file
    return None

def delete_file_record(file_id: str):
    """删除文件记录"""
    metadata = load_metadata()
    metadata["files"] = [f for f in metadata["files"] if f["id"] != file_id]
    save_metadata(metadata)

def get_all_files() -> List[Dict]:
    """获取所有文件记录"""
    metadata = load_metadata()
    # 按上传时间倒序排序
    return sorted(metadata["files"], key=lambda x: x["upload_time"], reverse=True)

def save_uploaded_file(file_content: bytes, filename: str, file_id: str) -> str:
    """保存上传的文件，返回文件路径"""
    # 创建文件目录（按日期分文件夹）
    date_str = datetime.now().strftime("%Y%m")
    file_dir = FILES_ROOT / date_str
    file_dir.mkdir(exist_ok=True)
    
    # 生成唯一文件名
    file_ext = Path(filename).suffix
    saved_filename = f"{file_id}{file_ext}"
    file_path = file_dir / saved_filename
    
    # 保存文件
    with open(file_path, 'wb') as f:
        f.write(file_content)
    
    return str(file_path)

def get_file_path(file_record: Dict) -> Path:
    """获取文件实际路径"""
    return Path(file_record["file_path"])

def delete_physical_file(file_record: Dict) -> bool:
    """删除物理文件"""
    try:
        file_path = get_file_path(file_record)
        if file_path.exists():
            file_path.unlink()
        return True
    except Exception:
        return False

def create_file_record(filename: str, file_size: int, file_type: str, 
                      chunk_count: int, content_preview: str) -> Dict:
    """创建文件记录"""
    file_id = str(uuid.uuid4())
    return {
        "id": file_id,
        "file_name": filename,
        "file_size": file_size,
        "file_type": file_type,
        "chunk_count": chunk_count,
        "upload_time": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "status": "success",
        "content_preview": content_preview[:200] if content_preview else "",
        "file_path": ""  # 会在保存文件后更新
    }