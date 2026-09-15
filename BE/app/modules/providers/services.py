import json
import time
import urllib.request
import urllib.error
from datetime import datetime
from typing import List, Optional
from sqlalchemy.orm import Session
from app.core.config import settings
from app.modules.providers.models import AIProvider
from app.modules.providers.schemas import (
    ProviderItem,
    CreateProviderRequest,
    UpdateProviderRequest,
    TestConnectionResponse,
    ProviderStatsResponse,
)

class ProvidersService:
    @staticmethod
    def _mask_key(key: str) -> str:
        if not key:
            return "sk-••••••••"
        if len(key) <= 8:
            return "sk-••••••••"
        return f"{key[:6]}...{key[-4:]}"

    def ensure_seeded(self, db: Session) -> None:
        """Khởi tạo danh sách các nhà cung cấp AI ban đầu nếu bảng rỗng"""
        try:
            count = db.query(AIProvider).count()
            if count > 0:
                primary = db.query(AIProvider).filter(AIProvider.is_primary == True).first()
                if primary:
                    self._sync_runtime_settings(primary, db)
                return

            initial_providers = [
                {
                    "id": "prov_xompet",
                    "name": "Xompet AI Gateway",
                    "provider_code": "xompet",
                    "base_url": getattr(settings, "UPSTREAM_PROVIDER_URL", "https://api.xompet.io.vn/v1"),
                    "api_key": getattr(settings, "UPSTREAM_PROVIDER_KEY", "sk-9r-N17BHJNt9a4E2TlrCdhHq3fvdIsiLnzz"),
                    "default_model": getattr(settings, "UPSTREAM_DEFAULT_IMAGE_MODEL", "gpt-image-2.5-flare"),
                    "models_supported": json.dumps([
                        "gpt-image-2.5-flare",
                        "gpt-image-2.5-sunburst",
                        "gpt-image-2",
                        "nanobanana-2"
                    ]),
                    "cost_per_image": 75.0,
                    "is_primary": True,
                    "is_active": True,
                    "status": "ONLINE",
                    "latency_ms": 32,
                    "notes": "Cổng NCC chính hiện tại. Hỗ trợ chuẩn Native OpenAI Image API (/v1/images/generations và /v1/images/edits), tính tiền theo ảnh thành công (fail không tính, ảnh refer miễn phí)."
                },
                {
                    "id": "prov_openai",
                    "name": "OpenAI Official Gateway",
                    "provider_code": "openai",
                    "base_url": "https://api.openai.com/v1",
                    "api_key": "sk-proj-official-openai-fallback-key-2026",
                    "default_model": "dall-e-3",
                    "models_supported": json.dumps([
                        "dall-e-3",
                        "dall-e-2"
                    ]),
                    "cost_per_image": 960.0,
                    "is_primary": False,
                    "is_active": False,
                    "status": "STANDBY",
                    "latency_ms": 115,
                    "notes": "Cổng kết nối dự phòng quốc tế (Standby), chuyển mạch tức thì khi cụm chính nâng cấp hoặc quá tải."
                }
            ]

            for item in initial_providers:
                db.add(AIProvider(**item))
            db.commit()
            print("[PostgreSQL] Seeded initial AI providers (Xompet, OpenAI).")
        except Exception as e:
            db.rollback()
            print(f"[ProvidersService] Warning on ensure_seeded: {e}")

    def _to_schema(self, p: AIProvider, include_full_key: bool = False) -> ProviderItem:
        try:
            models_list = json.loads(p.models_supported) if p.models_supported else []
        except Exception:
            models_list = []

        return ProviderItem(
            id=p.id,
            name=p.name,
            provider_code=p.provider_code,
            base_url=p.base_url,
            api_key_masked=self._mask_key(p.api_key),
            api_key=p.api_key if include_full_key else None,
            default_model=p.default_model,
            models_supported=models_list,
            cost_per_image=p.cost_per_image,
            is_primary=p.is_primary,
            is_active=p.is_active,
            status=p.status,
            latency_ms=p.latency_ms,
            notes=p.notes,
            created_at=p.created_at.strftime("%d/%m/%Y %H:%M") if p.created_at else None,
            updated_at=p.updated_at.strftime("%d/%m/%Y %H:%M") if p.updated_at else None,
        )

    def get_all(self, db: Session, include_full_key: bool = False) -> List[ProviderItem]:
        self.ensure_seeded(db)
        records = db.query(AIProvider).order_by(AIProvider.is_primary.desc(), AIProvider.name.asc()).all()
        return [self._to_schema(r, include_full_key) for r in records]

    def get_by_id(self, db: Session, provider_id: str, include_full_key: bool = True) -> Optional[ProviderItem]:
        record = db.query(AIProvider).filter(AIProvider.id == provider_id).first()
        if not record:
            return None
        return self._to_schema(record, include_full_key)

    def create(self, db: Session, req: CreateProviderRequest) -> ProviderItem:
        if req.is_primary:
            # Unset primary for all other providers
            db.query(AIProvider).update({AIProvider.is_primary: False})

        code = req.provider_code or req.name.lower().replace(" ", "_").replace("-", "_")[:32]
        # Ensure code is unique
        existing_code = db.query(AIProvider).filter(AIProvider.provider_code == code).first()
        if existing_code:
            code = f"{code}_{int(time.time()) % 10000}"

        provider = AIProvider(
            name=req.name,
            provider_code=code,
            base_url=req.base_url.rstrip("/"),
            api_key=req.api_key.strip(),
            default_model=req.default_model,
            models_supported=json.dumps(req.models_supported or [req.default_model]),
            cost_per_image=req.cost_per_image,
            is_primary=req.is_primary,
            is_active=req.is_active,
            status="ONLINE" if req.is_active else "STANDBY",
            latency_ms=45,
            notes=req.notes
        )
        db.add(provider)
        db.commit()
        db.refresh(provider)

        if req.is_primary:
            self._sync_runtime_settings(provider, db)

        return self._to_schema(provider, include_full_key=True)

    def update(self, db: Session, provider_id: str, req: UpdateProviderRequest) -> Optional[ProviderItem]:
        provider = db.query(AIProvider).filter(AIProvider.id == provider_id).first()
        if not provider:
            return None

        if req.is_primary is True:
            db.query(AIProvider).filter(AIProvider.id != provider_id).update({AIProvider.is_primary: False})
            provider.is_primary = True

        if req.name is not None:
            provider.name = req.name
        if req.base_url is not None:
            provider.base_url = req.base_url.rstrip("/")
        if req.api_key is not None and req.api_key.strip() and not req.api_key.startswith("sk-••"):
            provider.api_key = req.api_key.strip()
        if req.default_model is not None:
            provider.default_model = req.default_model
        if req.models_supported is not None:
            provider.models_supported = json.dumps(req.models_supported)
        if req.cost_per_image is not None:
            provider.cost_per_image = req.cost_per_image
        if req.is_active is not None:
            provider.is_active = req.is_active
        if req.notes is not None:
            provider.notes = req.notes

        db.commit()
        db.refresh(provider)

        if provider.is_primary:
            self._sync_runtime_settings(provider, db)

        return self._to_schema(provider, include_full_key=True)

    def set_primary(self, db: Session, provider_id: str) -> Optional[ProviderItem]:
        provider = db.query(AIProvider).filter(AIProvider.id == provider_id).first()
        if not provider:
            return None

        # Reset other providers
        db.query(AIProvider).filter(AIProvider.id != provider_id).update({AIProvider.is_primary: False})
        provider.is_primary = True
        provider.is_active = True
        provider.status = "ONLINE"

        db.commit()
        db.refresh(provider)

        self._sync_runtime_settings(provider, db)
        return self._to_schema(provider, include_full_key=True)

    def delete(self, db: Session, provider_id: str) -> bool:
        provider = db.query(AIProvider).filter(AIProvider.id == provider_id).first()
        if not provider:
            return False
        if provider.is_primary:
            raise ValueError("Không thể xóa nhà cung cấp đang được đặt làm NCC chính (Primary)")

        db.delete(provider)
        db.commit()
        return True

    def test_connection(self, db: Session, provider_id: str) -> TestConnectionResponse:
        provider = db.query(AIProvider).filter(AIProvider.id == provider_id).first()
        if not provider:
            raise ValueError("Không tìm thấy nhà cung cấp")

        url = f"{provider.base_url}/models"
        headers = {
            "Authorization": f"Bearer {provider.api_key}",
            "User-Agent": "MintForge-Provider-HealthCheck/1.0"
        }

        start_time = time.time()
        is_connected = False
        status_code = None
        message = ""

        try:
            req = urllib.request.Request(url, headers=headers, method="GET")
            with urllib.request.urlopen(req, timeout=5) as response:
                status_code = response.getcode()
                latency_ms = int((time.time() - start_time) * 1000)
                is_connected = (status_code in [200, 201])
                message = f"Kết nối thành công tới cổng {provider.name}. HTTP {status_code}"
        except urllib.error.HTTPError as e:
            latency_ms = int((time.time() - start_time) * 1000)
            status_code = e.code
            # Some providers like Xompet might return 404 or 405 on /models if only /images/generations is mounted,
            # or 401 if invalid key. 401 means endpoint reached but key failed.
            if status_code in [200, 404, 405]:
                is_connected = True
                message = f"Cổng phản hồi HTTP {status_code} ({latency_ms}ms) - Endpoint hoạt động tốt."
            elif status_code == 401:
                is_connected = False
                message = f"Máy chủ phản hồi HTTP 401: API Key không chính xác hoặc đã hết hạn."
            else:
                is_connected = False
                message = f"Máy chủ phản hồi HTTP {status_code}: {e.reason}"
        except Exception as e:
            latency_ms = int((time.time() - start_time) * 1000)
            is_connected = False
            message = f"Không thể kết nối: {str(e)}"

        # Update provider status & latency
        provider.latency_ms = latency_ms
        if is_connected:
            provider.status = "ONLINE"
        else:
            provider.status = "ERROR" if provider.is_primary else "OFFLINE"

        db.commit()

        return TestConnectionResponse(
            provider_id=provider.id,
            provider_name=provider.name,
            is_connected=is_connected,
            latency_ms=latency_ms,
            http_status=status_code,
            message=message,
            tested_at=datetime.now().strftime("%H:%M:%S %d/%m/%Y")
        )

    def get_stats(self, db: Session) -> ProviderStatsResponse:
        self.ensure_seeded(db)
        providers = db.query(AIProvider).all()
        total = len(providers)
        active = sum(1 for p in providers if p.is_active)
        primary = next((p for p in providers if p.is_primary), None)

        avg_lat = int(sum(p.latency_ms for p in providers) / total) if total else 0
        avg_cost = round(sum(p.cost_per_image for p in providers if p.is_active) / max(active, 1), 1)

        all_models = set()
        for p in providers:
            try:
                m_list = json.loads(p.models_supported) if p.models_supported else []
                all_models.update(m_list)
            except Exception:
                pass

        return ProviderStatsResponse(
            total_providers=total,
            active_providers=active,
            primary_provider=primary.name if primary else "Chưa cấu hình",
            primary_provider_url=primary.base_url if primary else None,
            primary_model=primary.default_model if primary else None,
            avg_latency_ms=avg_lat,
            avg_cost_vnd=avg_cost,
            supported_models_count=len(all_models)
        )

    def _sync_runtime_settings(self, p: AIProvider, db: Optional[Session] = None) -> None:
        """Cập nhật thông số provider vào settings của runtime đang chạy"""
        try:
            settings.UPSTREAM_PROVIDER_NAME = p.name
            settings.UPSTREAM_PROVIDER_URL = p.base_url
            settings.UPSTREAM_PROVIDER_KEY = p.api_key
            settings.UPSTREAM_DEFAULT_IMAGE_MODEL = p.default_model

            # Xóa cache trạng thái quota provider để giao diện phản ánh tức thì
            try:
                from app.modules.generations.services import generation_service
                generation_service._cached_provider_status = None
                generation_service._provider_status_time = 0.0
            except Exception:
                pass

            # Đồng bộ vào bảng provider_accounts trong DB
            if db:
                try:
                    from app.modules.generations.models import ProviderAccount
                    acc = db.query(ProviderAccount).filter(ProviderAccount.id == "provider_default").first()
                    if acc:
                        acc.provider_name = p.name
                        acc.api_key = p.api_key
                        acc.is_active = p.is_active
                        db.commit()
                except Exception:
                    pass

            print(f"[ProvidersService] Runtime settings synced to primary provider: {p.name} ({p.base_url})")
        except Exception as e:
            print(f"[ProvidersService] Error syncing runtime settings: {e}")

providers_service = ProvidersService()
