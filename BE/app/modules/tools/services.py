from typing import Dict, Any
from app.modules.tools.schemas import SystemGatewayConfig, UpdateGatewayConfigRequest
from app.modules.generations.cache import prompt_cache

class ToolsService:
    def __init__(self):
        self._config = SystemGatewayConfig()

    def get_config(self) -> SystemGatewayConfig:
        # Cập nhật số liệu thực từ prompt_cache
        self._config.smart_cache_entries = len(prompt_cache._memory_cache)
        # Tính toán dung lượng xấp xỉ
        self._config.smart_cache_size_mb = round(len(prompt_cache._memory_cache) * 0.045 + 0.1, 2)
        return self._config

    def update_config(self, payload: UpdateGatewayConfigRequest) -> SystemGatewayConfig:
        data = self._config.model_dump()
        update_data = {k: v for k, v in payload.model_dump().items() if v is not None}
        data.update(update_data)
        self._config = SystemGatewayConfig(**data)
        return self._config

    def flush_cache(self) -> Dict[str, Any]:
        count = len(prompt_cache._memory_cache)
        prompt_cache._memory_cache.clear()
        self._config.smart_cache_entries = 0
        self._config.smart_cache_size_mb = 0.0
        return {
            "flushed_entries": count,
            "freed_memory_mb": round(count * 0.045, 2),
            "status": "CACHE_PURGED_SUCCESSFULLY"
        }

tools_service = ToolsService()
