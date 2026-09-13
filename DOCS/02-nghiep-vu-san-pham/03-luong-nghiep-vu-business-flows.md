# 🔄 Luồng Nghiệp Vụ Người Dùng (Business User Flows)

Tài liệu này mô tả các luồng hành vi chính (End-to-End User Journeys) diễn ra trong nền tảng GPT-Images.

---

## 1. Luồng Nghiệp Vụ Cốt Lõi: Tạo Ảnh Từ Văn Bản (Text-to-Image Generation Flow)

```mermaid
sequenceDiagram
    autonumber
    actor User as Người dùng
    participant FE as Frontend UI (FE)
    participant BE as Backend Core API (BE)
    participant DB as Cơ sở dữ liệu
    participant AI as AI Engine (OpenAI / DALL-E)
    participant S3 as Cloud Storage (S3)

    User->>FE: Nhập prompt "Phi hành gia lướt sóng trên sao Hỏa" & Chọn Style
    FE->>BE: Gửi POST /api/v1/images/generate (Prompt, Style, Token)
    BE->>DB: Kiểm tra số dư Credit của người dùng
    alt Số dư không đủ (Credits < 1)
        BE-->>FE: Trả về HTTP 402 Payment Required
        FE-->>User: Hiển thị popup "Số dư không đủ, vui lòng nạp thêm credit"
    else Số dư hợp lệ
        BE->>DB: Khấu trừ tạm thời 1 Credit & Tạo bản ghi Status = PENDING
        BE->>AI: Gửi yêu cầu sinh ảnh tới AI Provider
        AI-->>BE: Trả về kết quả Raw Image (URL hoặc Base64)
        BE->>S3: Upload ảnh gốc tối ưu hóa định dạng WebP
        S3-->>BE: Trả về Public Image CDN URL
        BE->>DB: Cập nhật bản ghi Status = COMPLETED & Image URL
        BE-->>FE: Trả về dữ liệu ảnh đã tạo thành công
        FE-->>User: Hiển thị ảnh kèm hiệu ứng hoàn thành & Tùy chọn Tải về / Lưu
    end
```

---

## 2. Luồng Nghiệp Vụ Nạp Credit & Thanh Toán (Billing & Credit Top-up Flow)

```mermaid
sequenceDiagram
    autonumber
    actor User as Người dùng
    participant FE as Frontend UI
    participant BE as Backend Core
    participant Stripe as Cổng thanh toán (Stripe)
    participant DB as Database

    User->>FE: Chọn gói "Pro Pack 500 Credits - $20"
    FE->>BE: Yêu cầu tạo phiên thanh toán (POST /api/v1/billing/checkout)
    BE->>Stripe: Khởi tạo Stripe Checkout Session
    Stripe-->>BE: Trả về Session URL
    BE-->>FE: Chuyển hướng người dùng sang trang thanh toán Stripe
    User->>Stripe: Nhập thông tin thẻ & Xác nhận thanh toán
    Stripe->>BE: Gửi Webhook sự kiện checkout.session.completed
    BE->>BE: Xác thực chữ ký Webhook bí mật (Webhook Signature)
    BE->>DB: Cộng 500 Credits vào tài khoản User & Lưu giao dịch
    Stripe-->>FE: Chuyển hướng người dùng về trang thành công (Success Callback)
    FE->>BE: Gọi GET /api/v1/users/me để cập nhật số dư mới
    FE-->>User: Hiển thị thông báo "Nạp thành công 500 Credits!"
```
