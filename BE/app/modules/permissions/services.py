from typing import Dict, List
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.modules.auth.models import User
from app.modules.permissions.schemas import (
    RoleInfo,
    PermissionGroup,
    PermissionAction,
    PermissionsMatrixResponse
)

# Standard Permission Modules & Actions
PERMISSION_MODULES = [
    PermissionGroup(
        module_key="accounts",
        module_name="Quản Lý Tài Khoản & Người Dùng",
        description="Quản trị danh sách nhân sự, phân vai trò và cấp quyền truy cập hệ thống",
        actions=[
            PermissionAction(key="accounts.view", label="Xem danh sách", description="Xem hồ sơ & danh sách tài khoản"),
            PermissionAction(key="accounts.create", label="Thêm mới", description="Tạo tài khoản nhân sự mới"),
            PermissionAction(key="accounts.edit_role", label="Đổi vai trò", description="Thay đổi phân quyền & vai trò người dùng"),
            PermissionAction(key="accounts.toggle_status", label="Khóa / Kích hoạt", description="Bật hoặc tắt quyền truy cập tài khoản"),
            PermissionAction(key="accounts.delete", label="Xóa tài khoản", description="Xóa vĩnh viễn tài khoản khỏi hệ thống"),
        ]
    ),
    PermissionGroup(
        module_key="apikeys",
        module_name="Quản Lý API Keys & Tích Hợp",
        description="Cấp phát khóa bảo mật, giới hạn Rate Limit và kiểm soát lưu lượng gọi API AI",
        actions=[
            PermissionAction(key="apikeys.view", label="Xem danh sách Keys", description="Xem danh sách các API Keys đang hoạt động"),
            PermissionAction(key="apikeys.create", label="Tạo Key mới", description="Khởi tạo API Key kết nối hệ thống"),
            PermissionAction(key="apikeys.rate_limit", label="Cấu hình Rate Limit", description="Tùy chỉnh hạn mức requests/phút"),
            PermissionAction(key="apikeys.revoke", label="Thu hồi / Xóa Key", description="Hủy bỏ hoặc xóa API Key ngay lập tức"),
        ]
    ),
    PermissionGroup(
        module_key="billing",
        module_name="Ví Doanh Nghiệp & Thanh Toán",
        description="Quản lý dòng tiền, số dư ví, nạp tự động qua SePay và quản trị ngân hàng",
        actions=[
            PermissionAction(key="billing.view_balance", label="Xem số dư & Ví", description="Theo dõi số dư Credit và biến động số dư"),
            PermissionAction(key="billing.deposit_sepay", label="Nạp tiền SePay", description="Thực hiện giao dịch nạp tiền tự động qua QR"),
            PermissionAction(key="billing.manage_bank", label="Cấu hình ngân hàng", description="Thiết lập tài khoản nhận tiền doanh nghiệp"),
            PermissionAction(key="billing.export_report", label="Xuất báo cáo tài chính", description="Xuất sao kê giao dịch dạng CSV/Excel"),
        ]
    ),
    PermissionGroup(
        module_key="ai_studio",
        module_name="AI Generation & Models",
        description="Truy cập bộ tạo ảnh thế hệ mới, Prompt Assistant và thư viện tác phẩm",
        actions=[
            PermissionAction(key="ai.generate_images", label="Tạo ảnh AI", description="Sử dụng các AI Models để tạo ảnh nghệ thuật"),
            PermissionAction(key="ai.hd_quality", label="Tạo ảnh Ultra HD / 4K", description="Quyền xuất ảnh độ phân giải cao tiêu tốn Credit"),
            PermissionAction(key="ai.prompt_assistant", label="Trợ lý Prompt Pro", description="Sử dụng gợi ý tăng cường Prompt AI"),
            PermissionAction(key="ai.view_gallery", label="Quản lý Thư viện", description="Xem, tải về và chia sẻ bộ sưu tập ảnh"),
        ]
    ),
    PermissionGroup(
        module_key="system",
        module_name="Cấu Hình & Nhật Ký Hệ Thống",
        description="Theo dõi hoạt động bảo mật, Audit Logs và thiết lập bảo vệ OWASP",
        actions=[
            PermissionAction(key="system.settings", label="Cài đặt hệ thống", description="Tùy biến tham số nền tảng"),
            PermissionAction(key="system.audit_logs", label="Xem Audit Logs", description="Xem nhật ký truy cập và bảo mật"),
            PermissionAction(key="system.security_policy", label="Chính sách bảo mật", description="Thiết lập Brute-force Shield & Headers"),
        ]
    ),
]

# In-memory storage for customizable role matrix with defaults
DEFAULT_ROLE_MATRIX: Dict[str, List[str]] = {
    "SUPER_ADMIN": [
        "accounts.view", "accounts.create", "accounts.edit_role", "accounts.toggle_status", "accounts.delete",
        "apikeys.view", "apikeys.create", "apikeys.rate_limit", "apikeys.revoke",
        "billing.view_balance", "billing.deposit_sepay", "billing.manage_bank", "billing.export_report",
        "ai.generate_images", "ai.hd_quality", "ai.prompt_assistant", "ai.view_gallery",
        "system.settings", "system.audit_logs", "system.security_policy"
    ],
    "ADMIN": [
        "accounts.view", "accounts.create", "accounts.toggle_status",
        "apikeys.view", "apikeys.create", "apikeys.rate_limit", "apikeys.revoke",
        "billing.view_balance", "billing.deposit_sepay", "billing.export_report",
        "ai.generate_images", "ai.hd_quality", "ai.prompt_assistant", "ai.view_gallery",
        "system.audit_logs"
    ],
    "DEVELOPER": [
        "apikeys.view", "apikeys.create",
        "billing.view_balance",
        "ai.generate_images", "ai.hd_quality", "ai.prompt_assistant", "ai.view_gallery"
    ],
    "MEMBER": [
        "billing.view_balance",
        "ai.generate_images", "ai.view_gallery"
    ]
}

# Active matrix state in service
active_matrix: Dict[str, List[str]] = {k: list(v) for k, v in DEFAULT_ROLE_MATRIX.items()}

class PermissionsService:
    @staticmethod
    def get_permissions_matrix(db: Session = None) -> PermissionsMatrixResponse:
        close_session = False
        if db is None:
            db = SessionLocal()
            close_session = True

        try:
            # Query user counts per role
            users = db.query(User).all()
            super_admin_count = sum(1 for u in users if u.role == "SUPER_ADMIN")
            admin_count = sum(1 for u in users if u.role == "ADMIN")
            developer_count = sum(1 for u in users if u.role == "DEVELOPER")
            member_count = sum(1 for u in users if u.role == "MEMBER")

            roles = [
                RoleInfo(
                    code="SUPER_ADMIN",
                    name="Quản Trị Viên Tối Cao (Super Admin)",
                    description="Toàn quyền kiểm soát tài khoản, tài chính, API Keys và cấu hình bảo mật",
                    badge_color="purple",
                    user_count=super_admin_count,
                    is_system=True
                ),
                RoleInfo(
                    code="ADMIN",
                    name="Quản Trị Kỹ Thuật (Admin)",
                    description="Quản lý nhân sự, API keys, ví doanh nghiệp và theo dõi Audit Logs",
                    badge_color="brand",
                    user_count=admin_count,
                    is_system=False
                ),
                RoleInfo(
                    code="DEVELOPER",
                    name="Kỹ Sư Phát Triển (Developer)",
                    description="Tạo và quản lý API Keys phục vụ tích hợp hệ thống, sử dụng AI Studio",
                    badge_color="blue",
                    user_count=developer_count,
                    is_system=False
                ),
                RoleInfo(
                    code="MEMBER",
                    name="Thành Viên Nghiệp Vụ (Member)",
                    description="Sử dụng dịch vụ tạo ảnh cơ bản, xem thư viện và số dư cá nhân",
                    badge_color="emerald",
                    user_count=member_count,
                    is_system=False
                ),
            ]

            return PermissionsMatrixResponse(
                roles=roles,
                modules=PERMISSION_MODULES,
                matrix=active_matrix
            )
        finally:
            if close_session:
                db.close()

    @staticmethod
    def update_role_permissions(role_code: str, permissions: List[str]) -> Dict[str, List[str]]:
        code = role_code.upper()
        if code in active_matrix:
            active_matrix[code] = permissions
        return active_matrix

    @staticmethod
    def reset_default_permissions() -> Dict[str, List[str]]:
        global active_matrix
        active_matrix = {k: list(v) for k, v in DEFAULT_ROLE_MATRIX.items()}
        return active_matrix

permissions_service = PermissionsService()
