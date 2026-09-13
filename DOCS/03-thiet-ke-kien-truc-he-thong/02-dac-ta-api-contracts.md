# 🔌 Đặc Tả Giao Diện Lập Trình (API Contracts & Specifications)

Tất cả các API được phát triển theo chuẩn **RESTful JSON**, sử dụng mã lỗi HTTP tiêu chuẩn và xác thực thông qua header `Authorization: Bearer <access_token>`.

---

## 1. Chuẩn Phản Hồi Chung (Standard Response Format)

### Thành công:
```json
{
  "success": true,
  "data": { ... },
  "message": "Thao tác thành công"
}
```

### Thất bại:
```json
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_CREDITS",
    "message": "Số dư credit không đủ để thực hiện yêu cầu"
  }
}
```

---

## 2. Danh Sách Endpoints Nghiệp Vụ Cốt Lõi

### 2.1. Phân Hệ Xác Thực (`/api/v1/auth`)

| Phương thức | Endpoint | Mô tả | Yêu cầu Auth |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/register` | Đăng ký tài khoản mới bằng Email/Password | Không |
| `POST` | `/api/v1/auth/login` | Đăng nhập lấy cặp Access & Refresh Token | Không |
| `POST` | `/api/v1/auth/refresh` | Cấp mới Access Token khi hết hạn | Có (Refresh Token) |
| `GET` | `/api/v1/users/me` | Lấy thông tin cá nhân & số dư credit hiện tại | Có |

---

### 2.2. Phân Hệ Tạo Ảnh AI (`/api/v1/images`)

#### `POST /api/v1/images/generate`
Gửi yêu cầu tạo ảnh mới từ prompt.

- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
```json
{
  "prompt": "A futuristic cybernetic tiger prowling through a neon-lit Tokyo street at rain",
  "negative_prompt": "blurry, low quality, distorted, extra limbs",
  "aspect_ratio": "16:9",
  "style": "cyberpunk",
  "quality": "standard"
}
```

- **Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "job_id": "job_98a72e10",
    "image_id": "img_b492fc1",
    "image_url": "https://cdn.gptimages.app/renders/2026/img_b492fc1.webp",
    "prompt": "A futuristic cybernetic tiger prowling through a neon-lit Tokyo street at rain",
    "credits_deducted": 1,
    "remaining_credits": 19,
    "created_at": "2026-09-13T12:00:00Z"
  }
}
```

---

### 2.3. Phân Hệ Thư Viện (`/api/v1/gallery`)

| Phương thức | Endpoint | Mô tả | Yêu cầu Auth |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/gallery/my-images` | Lấy danh sách ảnh cá nhân đã tạo (phân trang) | Có |
| `GET` | `/api/v1/gallery/public-feed` | Lấy danh sách ảnh công khai trên trang Khám phá | Không |
| `DELETE` | `/api/v1/gallery/:id` | Xóa ảnh khỏi thư viện | Có |

---

### 2.4. Phân Hệ Thanh Toán (`/api/v1/billing`)

| Phương thức | Endpoint | Mô tả | Yêu cầu Auth |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/billing/checkout` | Khởi tạo phiên thanh toán mua gói credit | Có |
| `POST` | `/api/v1/billing/webhook` | Webhook tiếp nhận callback từ cổng thanh toán Stripe | Header Signature |
