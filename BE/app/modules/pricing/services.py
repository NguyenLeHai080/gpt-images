import json
from datetime import datetime
from typing import List, Optional, Tuple
from sqlalchemy.orm import Session
from app.modules.pricing.models import ModelPricing
from app.modules.pricing.schemas import (
    ModelPricingItem,
    ResolutionRate,
    QualityRate,
    CreateModelPricingRequest,
    UpdateModelPricingRequest,
    PricingSimulatorRequest,
    PricingSimulatorResponse,
)

DEFAULT_SEEDS = [
    {
        "model": "gpt-image-2",
        "display_name": "GPT Image 2 Enterprise",
        "provider": "Leeh AI Cloud",
        "provider_cost": 120.0,
        "base_price": 150.0,
        "token_rate": 1024,
        "currency": "VND",
        "unit": "ảnh",
        "status": "ACTIVE",
        "latency_range": "25ms (Cache) - 3.2s (Gen)",
        "smart_cache_support": True,
        "cache_cost": 0.0,
        "resolutions": [
            {"key": "1k", "label": "1K Standard", "dimension": "1024x1024", "multiplier": 1.0, "unit_price": 150.0},
            {"key": "2k", "label": "2K Crisp HD", "dimension": "2048x2048", "multiplier": 1.0, "unit_price": 150.0},
            {"key": "4k", "label": "4K Ultra High", "dimension": "4096x4096", "multiplier": 1.0, "unit_price": 150.0},
        ],
        "qualities": [
            {"key": "low", "label": "Low (Draft/Fast)", "multiplier": 1.0, "description": "Tốc độ cao nhất, phác thảo ý tưởng nhanh"},
            {"key": "medium", "label": "Medium (Balanced)", "multiplier": 1.0, "description": "Chất lượng tiêu chuẩn, cân bằng độ nét"},
            {"key": "high", "label": "High (Ultra Detail)", "multiplier": 1.0, "description": "Độ chi tiết tối đa, texture và ánh sáng chân thực"},
        ],
        "description": "Mô hình thế hệ mới với khả năng hiểu prompt tự nhiên tiếng Việt, hỗ trợ tỷ lệ khung hình tùy chỉnh và cache tức thì 25ms."
    }
]

class PricingService:
    def ensure_seeded(self, db: Session):
        """Khởi tạo seed mặc định gpt-image-2 nếu chưa tồn tại"""
        try:
            count = db.query(ModelPricing).filter(ModelPricing.model == "gpt-image-2").count()
            if count == 0:
                for s in DEFAULT_SEEDS:
                    record = ModelPricing(
                        model=s["model"],
                        display_name=s["display_name"],
                        provider=s["provider"],
                        provider_cost=s["provider_cost"],
                        base_price=s["base_price"],
                        token_rate=s["token_rate"],
                        currency=s["currency"],
                        unit=s["unit"],
                        status=s["status"],
                        latency_range=s["latency_range"],
                        smart_cache_support=s["smart_cache_support"],
                        cache_cost=s["cache_cost"],
                        resolutions_json=json.dumps(s["resolutions"]),
                        qualities_json=json.dumps(s["qualities"]),
                        description=s["description"]
                    )
                    db.add(record)
                db.commit()
        except Exception as e:
            db.rollback()
            print(f"[PricingService] Warning on ensure_seeded: {e}")

    def get_all(self, db: Optional[Session] = None, is_admin: bool = False) -> List[ModelPricingItem]:
        items: List[ModelPricingItem] = []
        
        if db:
            self.ensure_seeded(db)
            records = db.query(ModelPricing).all()
            for r in records:
                resolutions = [ResolutionRate(**x) for x in json.loads(r.resolutions_json or "[]")]
                qualities = [QualityRate(**x) for x in json.loads(r.qualities_json or "[]")]
                
                prov_cost = r.provider_cost if is_admin else None
                profit_amt = (r.base_price - r.provider_cost) if is_admin else None
                profit_margin = round(((r.base_price - r.provider_cost) / r.base_price * 100), 1) if (is_admin and r.base_price > 0) else None

                items.append(
                    ModelPricingItem(
                        model=r.model,
                        display_name=r.display_name,
                        provider=r.provider,
                        base_price=r.base_price,
                        provider_cost=prov_cost,
                        token_rate=r.token_rate,
                        profit_amount=profit_amt,
                        profit_margin_pct=profit_margin,
                        currency=r.currency,
                        unit=r.unit,
                        status=r.status,
                        latency_range=r.latency_range,
                        smart_cache_support=r.smart_cache_support,
                        cache_cost=r.cache_cost,
                        resolutions=resolutions,
                        qualities=qualities,
                        description=r.description or ""
                    )
                )
            if items:
                return items

        # Fallback to default in-memory seeds
        for s in DEFAULT_SEEDS:
            prov_cost = s["provider_cost"] if is_admin else None
            profit_amt = (s["base_price"] - s["provider_cost"]) if is_admin else None
            profit_margin = round(((s["base_price"] - s["provider_cost"]) / s["base_price"] * 100), 1) if (is_admin and s["base_price"] > 0) else None

            items.append(
                ModelPricingItem(
                    model=s["model"],
                    display_name=s["display_name"],
                    provider=s["provider"],
                    base_price=s["base_price"],
                    provider_cost=prov_cost,
                    token_rate=s["token_rate"],
                    profit_amount=profit_amt,
                    profit_margin_pct=profit_margin,
                    currency=s["currency"],
                    unit=s["unit"],
                    status=s["status"],
                    latency_range=s["latency_range"],
                    smart_cache_support=s["smart_cache_support"],
                    cache_cost=s["cache_cost"],
                    resolutions=[ResolutionRate(**x) for x in s["resolutions"]],
                    qualities=[QualityRate(**x) for x in s["qualities"]],
                    description=s["description"]
                )
            )
        return items

    def get_model_financials(self, db: Optional[Session], model_name: str) -> Tuple[float, float, int]:
        """
        Trả về (provider_cost, base_price, token_rate) cho một model.
        Mặc định nếu không tìm thấy: vốn 120đ, bán 150đ, 1024 tokens.
        """
        if db:
            try:
                record = db.query(ModelPricing).filter(ModelPricing.model == model_name).first()
                if record:
                    return (record.provider_cost, record.base_price, record.token_rate)
            except Exception:
                pass
        
        for s in DEFAULT_SEEDS:
            if s["model"] == model_name:
                return (s["provider_cost"], s["base_price"], s["token_rate"])
        
        return (120.0, 150.0, 1024)

    def create_pricing(self, db: Session, req: CreateModelPricingRequest) -> ModelPricingItem:
        self.ensure_seeded(db)
        clean_model = req.model.strip().lower()
        existing = db.query(ModelPricing).filter(ModelPricing.model == clean_model).first()
        if existing:
            raise ValueError(f"Model '{clean_model}' đã tồn tại trên hệ thống")

        resolutions = [
            {"key": "1k", "label": "1K Standard", "dimension": "1024x1024", "multiplier": 1.0, "unit_price": float(req.base_price)},
            {"key": "2k", "label": "2K Crisp HD", "dimension": "2048x2048", "multiplier": 1.0, "unit_price": float(req.base_price)},
            {"key": "4k", "label": "4K Ultra High", "dimension": "4096x4096", "multiplier": 1.0, "unit_price": float(req.base_price)},
        ]
        qualities = [
            {"key": "low", "label": "Low (Draft/Fast)", "multiplier": 1.0, "description": "Tốc độ cao nhất, phác thảo ý tưởng nhanh"},
            {"key": "medium", "label": "Medium (Balanced)", "multiplier": 1.0, "description": "Chất lượng tiêu chuẩn, cân bằng độ nét"},
            {"key": "high", "label": "High (Ultra Detail)", "multiplier": 1.0, "description": "Độ chi tiết tối đa, texture và ánh sáng chân thực"},
        ]

        record = ModelPricing(
            model=clean_model,
            display_name=req.display_name.strip(),
            provider=req.provider.strip(),
            provider_cost=float(req.provider_cost),
            base_price=float(req.base_price),
            token_rate=int(req.token_rate),
            currency=req.currency,
            unit=req.unit,
            status=req.status,
            latency_range=req.latency_range or "25ms (Cache) - 3.2s (Gen)",
            smart_cache_support=req.smart_cache_support,
            cache_cost=float(req.cache_cost),
            resolutions_json=json.dumps(resolutions),
            qualities_json=json.dumps(qualities),
            description=req.description or ""
        )
        db.add(record)
        db.commit()
        db.refresh(record)

        profit_amt = record.base_price - record.provider_cost
        profit_margin = round((profit_amt / record.base_price * 100), 1) if record.base_price > 0 else 0.0

        return ModelPricingItem(
            model=record.model,
            display_name=record.display_name,
            provider=record.provider,
            base_price=record.base_price,
            provider_cost=record.provider_cost,
            token_rate=record.token_rate,
            profit_amount=profit_amt,
            profit_margin_pct=profit_margin,
            currency=record.currency,
            unit=record.unit,
            status=record.status,
            latency_range=record.latency_range,
            smart_cache_support=record.smart_cache_support,
            cache_cost=record.cache_cost,
            resolutions=[ResolutionRate(**x) for x in resolutions],
            qualities=[QualityRate(**x) for x in qualities],
            description=record.description or ""
        )

    def delete_pricing(self, db: Session, model: str) -> bool:
        self.ensure_seeded(db)
        record = db.query(ModelPricing).filter(ModelPricing.model == model).first()
        if not record:
            return False
        db.delete(record)
        db.commit()
        return True

    def update_pricing(self, db: Session, model: str, req: UpdateModelPricingRequest) -> Optional[ModelPricingItem]:
        self.ensure_seeded(db)
        record = db.query(ModelPricing).filter(ModelPricing.model == model).first()
        if not record:
            return None

        if req.provider_cost is not None:
            record.provider_cost = float(req.provider_cost)
        if req.base_price is not None:
            record.base_price = float(req.base_price)
            # Cập nhật đơn giá các resolution tương ứng
            try:
                resolutions = json.loads(record.resolutions_json or "[]")
                for r in resolutions:
                    mult = r.get("multiplier", 1.0)
                    r["unit_price"] = round(record.base_price * mult, 2)
                record.resolutions_json = json.dumps(resolutions)
            except Exception:
                pass
        if req.token_rate is not None:
            record.token_rate = int(req.token_rate)
        if req.status is not None:
            record.status = req.status
        if req.display_name is not None:
            record.display_name = req.display_name
        if req.provider is not None:
            record.provider = req.provider
        if req.latency_range is not None:
            record.latency_range = req.latency_range
        if req.smart_cache_support is not None:
            record.smart_cache_support = req.smart_cache_support
        if req.description is not None:
            record.description = req.description

        record.updated_at = datetime.now()
        db.commit()
        db.refresh(record)

        resolutions = [ResolutionRate(**x) for x in json.loads(record.resolutions_json or "[]")]
        qualities = [QualityRate(**x) for x in json.loads(record.qualities_json or "[]")]
        profit_amt = record.base_price - record.provider_cost
        profit_margin = round((profit_amt / record.base_price * 100), 1) if record.base_price > 0 else 0.0

        return ModelPricingItem(
            model=record.model,
            display_name=record.display_name,
            provider=record.provider,
            base_price=record.base_price,
            provider_cost=record.provider_cost,
            token_rate=record.token_rate,
            profit_amount=profit_amt,
            profit_margin_pct=profit_margin,
            currency=record.currency,
            unit=record.unit,
            status=record.status,
            latency_range=record.latency_range,
            smart_cache_support=record.smart_cache_support,
            cache_cost=record.cache_cost,
            resolutions=resolutions,
            qualities=qualities,
            description=record.description or ""
        )

    def calculate_simulation(self, req: PricingSimulatorRequest, db: Optional[Session] = None) -> PricingSimulatorResponse:
        _, base_unit_price, _ = self.get_model_financials(db, req.model)

        total_images = max(1, req.monthly_images)
        raw_total = total_images * base_unit_price

        # Smart Cache Hit Rate calculation
        hit_pct = min(90, max(0, req.cache_hit_rate_pct)) / 100.0
        cache_hits = int(total_images * hit_pct)
        savings = cache_hits * base_unit_price
        final_cost = raw_total - savings

        if final_cost <= 150000:
            rec_pkg = "Mức Tiêu Chuẩn (Khởi động)"
        elif final_cost <= 600000:
            rec_pkg = "Mức Chuyên Nghiệp (Studio)"
        elif final_cost <= 2500000:
            rec_pkg = "Mức Doanh Nghiệp (Enterprise)"
        else:
            rec_pkg = "Mức Mở Rộng (Không giới hạn)"

        return PricingSimulatorResponse(
            monthly_images=total_images,
            unit_price=base_unit_price,
            estimated_total_raw=raw_total,
            estimated_cache_savings=savings,
            estimated_monthly_cost=final_cost,
            recommended_package=rec_pkg
        )

pricing_service = PricingService()
