import hashlib
import json
from collections import OrderedDict
from datetime import datetime
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session

from app.modules.generations.models import ImageGenerationCache

def compute_cache_key(
    model: str,
    prompt: str,
    aspect_ratio: str,
    resolution: str,
    references: Optional[List[str]] = None,
    quality: Optional[str] = "medium"
) -> str:
    """
    Sinh khóa băm SHA-256 duy nhất từ các thuộc tính cốt lõi của yêu cầu tạo ảnh.
    Hỗ trợ model, prompt, aspect_ratio, resolution (1k/2k/4k), quality (low/medium/high) và references.
    """
    norm_model = (model or "gpt-image-2").strip().lower()
    norm_prompt = (prompt or "").strip().lower()
    norm_ar = (aspect_ratio or "1024x1024").strip().lower()
    norm_res = (resolution or "1k").strip().lower()
    norm_qual = (quality or "medium").strip().lower()
    
    clean_refs = sorted([str(r).strip() for r in references if r and str(r).strip()]) if references else []
    refs_str = json.dumps(clean_refs, sort_keys=True)
    
    raw_payload = f"{norm_model}:{norm_prompt}:{norm_ar}:{norm_res}:{norm_qual}:{refs_str}"
    return hashlib.sha256(raw_payload.encode("utf-8")).hexdigest()

class PromptCacheManager:
    """
    Quản lý bộ đệm thông minh 2 lớp:
    Lớp 1: In-Memory LRU Cache (RAM) cho tốc độ < 5ms
    Lớp 2: PostgreSQL Cache (Persistent DB) cho độ tin cậy và lưu trữ vĩnh viễn
    """
    def __init__(self, max_memory_entries: int = 1000):
        self.max_memory = max_memory_entries
        self._memory_cache: OrderedDict[str, Dict[str, Any]] = OrderedDict()

    def get(self, db: Session, key: str) -> Optional[Dict[str, Any]]:
        # 1. Kiểm tra trong Lớp 1 (RAM)
        if key in self._memory_cache:
            self._memory_cache.move_to_end(key)
            cached_val = self._memory_cache[key]
            
            # Cập nhật thống kê hit count vào DB
            try:
                db_item = db.query(ImageGenerationCache).filter(ImageGenerationCache.id == key).first()
                if db_item:
                    db_item.hit_count += 1
                    db_item.last_accessed_at = datetime.now()
                    db.commit()
            except Exception:
                db.rollback()
                
            return cached_val

        # 2. Kiểm tra trong Lớp 2 (PostgreSQL)
        db_item = db.query(ImageGenerationCache).filter(ImageGenerationCache.id == key).first()
        if db_item:
            db_item.hit_count += 1
            db_item.last_accessed_at = datetime.now()
            db.commit()

            cache_data = {
                "id": db_item.id,
                "prompt": db_item.prompt,
                "model": db_item.model,
                "aspect_ratio": db_item.aspect_ratio,
                "resolution": db_item.resolution,
                "image_url": db_item.image_url,
                "provider_task_id": db_item.provider_task_id,
                "hit_count": db_item.hit_count
            }
            # Nạp lại vào Lớp 1 (RAM)
            self._set_memory(key, cache_data)
            return cache_data

        return None

    def set(
        self,
        db: Session,
        key: str,
        prompt: str,
        model: str,
        aspect_ratio: str,
        resolution: str,
        image_url: str,
        provider_task_id: Optional[str] = None,
        references: Optional[List[str]] = None,
        quality: Optional[str] = "medium"
    ) -> None:
        cache_data = {
            "id": key,
            "prompt": prompt,
            "model": model,
            "aspect_ratio": aspect_ratio,
            "resolution": resolution,
            "quality": quality or "medium",
            "image_url": image_url,
            "provider_task_id": provider_task_id,
            "hit_count": 0
        }

        # Lưu Lớp 1 (RAM)
        self._set_memory(key, cache_data)

        # Lưu Lớp 2 (PostgreSQL)
        try:
            existing = db.query(ImageGenerationCache).filter(ImageGenerationCache.id == key).first()
            if existing:
                existing.image_url = image_url
                existing.provider_task_id = provider_task_id
                existing.quality = quality or "medium"
                existing.last_accessed_at = datetime.now()
            else:
                new_cache = ImageGenerationCache(
                    id=key,
                    prompt=prompt,
                    model=model,
                    aspect_ratio=aspect_ratio,
                    resolution=resolution,
                    quality=quality or "medium",
                    references_json=json.dumps(references) if references else None,
                    image_url=image_url,
                    provider_task_id=provider_task_id,
                    hit_count=0,
                    created_at=datetime.now(),
                    last_accessed_at=datetime.now()
                )
                db.add(new_cache)
            db.commit()
        except Exception:
            db.rollback()

    def _set_memory(self, key: str, value: Dict[str, Any]) -> None:
        if key in self._memory_cache:
            self._memory_cache.move_to_end(key)
        self._memory_cache[key] = value
        if len(self._memory_cache) > self.max_memory:
            self._memory_cache.popitem(last=False)

prompt_cache = PromptCacheManager()
