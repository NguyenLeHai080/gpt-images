import uuid
from typing import List, Optional
from app.modules.packages.schemas import PackageItem, CreatePackageRequest, UpdatePackageRequest

DEFAULT_PACKAGES: List[PackageItem] = [
    PackageItem(
        id="pkg_starter",
        name="Gói Khởi Động (Starter)",
        price=100000.0,
        credits=700,
        bonus_credits=50,
        discount_pct=0,
        badge=None,
        description="Phù hợp cá nhân trải nghiệm tạo ảnh chất lượng cao và tích hợp thử nghiệm API.",
        is_popular=False,
        is_active=True,
        features=[
            "750 lượt tạo ảnh gpt-image-2 (1K/2K)",
            "Tốc độ phản hồi ưu tiên tiêu chuẩn",
            "Tối đa 2 API Keys hoạt động",
            "Bảo lưu số dư vĩnh viễn không hết hạn"
        ]
    ),
    PackageItem(
        id="pkg_pro",
        name="Gói Chuyên Nghiệp (Pro Studio)",
        price=500000.0,
        credits=3800,
        bonus_credits=500,
        discount_pct=15,
        badge="PHỔ BIẾN NHẤT",
        description="Dành cho Studio đồ họa, Content Creator và nhà phát triển ứng dụng vừa & nhỏ.",
        is_popular=True,
        is_active=True,
        features=[
            "4,300 lượt tạo ảnh độ nét cao (2K/4K)",
            "Băng thông API ưu tiên tốc độ cao",
            "Không giới hạn API Keys kết nối",
            "Bảo hộ Smart Cache 25ms tiết kiệm chi phí",
            "Hỗ trợ kỹ thuật ưu tiên 24/7"
        ]
    ),
    PackageItem(
        id="pkg_business",
        name="Gói Doanh Nghiệp (Enterprise AI)",
        price=2000000.0,
        credits=18000,
        bonus_credits=3000,
        discount_pct=25,
        badge="TIẾT KIỆM 25%",
        description="Dành cho nền tảng thương mại điện tử, ứng dụng di động có lưu lượng truy cập lớn.",
        is_popular=False,
        is_active=True,
        features=[
            "21,000 lượt tạo ảnh cao cấp 4K Ultra HD",
            "Đường truyền riêng Dedicated High-Speed Node",
            "Webhook đối soát dòng tiền tự động",
            "Hỗ trợ xuất hóa đơn VAT điện tử",
            "Cố vấn tích hợp kiến trúc kỹ thuật riêng"
        ]
    ),
    PackageItem(
        id="pkg_custom",
        name="Gói Tùy Biến (Custom Unlimited)",
        price=5000000.0,
        credits=50000,
        bonus_credits=10000,
        discount_pct=30,
        badge="DOANH NGHIỆP LỚN",
        description="Giải pháp tài nguyên không giới hạn, cam kết SLA 99.99% cho tập đoàn.",
        is_popular=False,
        is_active=True,
        features=[
            "60,000 lượt tạo ảnh đa kích cỡ",
            "Quyền điều phối cụm Upstream dự phòng riêng",
            "Cam kết SLA uptime 99.99%",
            "Hạn mức Rate Limit tùy biến lên tới 1000 req/min"
        ]
    ),
]

class PackagesService:
    def __init__(self):
        self._packages: List[PackageItem] = list(DEFAULT_PACKAGES)

    def get_all(self, active_only: bool = False) -> List[PackageItem]:
        if active_only:
            return [p for p in self._packages if p.is_active]
        return list(self._packages)

    def get_by_id(self, package_id: str) -> Optional[PackageItem]:
        for p in self._packages:
            if p.id == package_id:
                return p
        return None

    def create(self, payload: CreatePackageRequest) -> PackageItem:
        new_pkg = PackageItem(
            id=f"pkg_{uuid.uuid4().hex[:8]}",
            **payload.model_dump()
        )
        self._packages.append(new_pkg)
        return new_pkg

    def update(self, package_id: str, payload: UpdatePackageRequest) -> Optional[PackageItem]:
        for idx, p in enumerate(self._packages):
            if p.id == package_id:
                data = p.model_dump()
                update_data = {k: v for k, v in payload.model_dump().items() if v is not None}
                data.update(update_data)
                updated_pkg = PackageItem(**data)
                self._packages[idx] = updated_pkg
                return updated_pkg
        return None

    def delete(self, package_id: str) -> bool:
        initial_len = len(self._packages)
        self._packages = [p for p in self._packages if p.id != package_id]
        return len(self._packages) < initial_len

packages_service = PackagesService()
