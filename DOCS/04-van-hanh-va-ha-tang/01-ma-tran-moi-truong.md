# 🌐 Ma Trận Quản Trị Môi Trường (Environments Matrix)

Hệ thống duy trì 3 môi trường biệt lập tương ứng trực tiếp với 3 nhánh chính trong Gitflow nhằm bảo đảm an toàn dữ liệu và phân tách rõ ràng trách nhiệm.

---

## 1. Ma Trận Môi Trường

| Tiêu chí | Development (`dev`) | Staging (`staging`) | Production (`prod`) |
| :--- | :--- | :--- | :--- |
| **Nhánh Git phụ trách** | `dev` | `staging` | `prod` |
| **Mục đích** | Tích hợp mã nguồn mới, kiểm thử tính năng nội bộ dev | Kiểm thử chấp nhận (UAT), QA/QC test, Demo tính năng | Phục vụ người dùng thực tế & vận hành kinh doanh |
| **URL Truy cập** | `https://dev.gptimages.app` | `https://staging.gptimages.app` | `https://gptimages.app` |
| **Cơ sở dữ liệu** | Database Dev cục bộ / Cloud dev (Dữ liệu giả lập - Mock data) | Staging DB (Dữ liệu ẩn danh hóa - Sanitized data) | Production DB (Dữ liệu thực, sao lưu định kỳ hàng ngày) |
| **Cổng thanh toán** | Stripe Sandbox / Mock | Stripe Test Mode | Stripe Live Mode |
| **Tần suất triển khai** | Tự động mỗi khi merge PR vào `dev` | Tự động mỗi khi merge từ `dev` vào `staging` | Thủ công (Manual trigger) sau khi phê duyệt release tag |
| **Bảo mật & Cảnh báo** | Debug logs mức độ cao (VERBOSE) | Logging mức INFO, giám sát qua Sentry | Cảnh báo Real-time (PagerDuty/Slack), Sentry Alert |
