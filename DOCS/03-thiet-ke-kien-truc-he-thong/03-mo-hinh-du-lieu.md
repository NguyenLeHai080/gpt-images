# 🗄️ Mô Hình Dữ Liệu Cơ Sở (Database Schema & Entity Relationship)

Hệ thống sử dụng cơ sở dữ liệu quan hệ (PostgreSQL) kết hợp với Redis Cache để đảm bảo tính toàn vẹn dữ liệu giao dịch tài chính (ACID) và hiệu năng truy vấn nhanh.

---

## 1. Sơ Đồ Thực Thể Quan Hệ (Entity Relationship Diagram - ERD)

```mermaid
erDiagram
    USERS ||--o{ IMAGES : creates
    USERS ||--o{ TRANSACTIONS : pays
    USERS ||--o{ COLLECTIONS : owns
    COLLECTIONS ||--o{ COLLECTION_ITEMS : contains
    IMAGES ||--o{ COLLECTION_ITEMS : referenced_in

    USERS {
        uuid id PK
        varchar email UK
        varchar password_hash
        varchar full_name
        varchar avatar_url
        integer credits_balance
        varchar role
        timestamp created_at
        timestamp updated_at
    }

    IMAGES {
        uuid id PK
        uuid user_id FK
        text prompt
        text negative_prompt
        varchar aspect_ratio
        varchar style
        varchar cdn_url
        varchar status
        integer credits_cost
        boolean is_public
        timestamp created_at
    }

    TRANSACTIONS {
        uuid id PK
        uuid user_id FK
        varchar stripe_session_id UK
        integer amount_cents
        varchar currency
        integer credits_added
        varchar payment_status
        timestamp created_at
    }

    COLLECTIONS {
        uuid id PK
        uuid user_id FK
        varchar title
        text description
        boolean is_private
        timestamp created_at
    }

    COLLECTION_ITEMS {
        uuid id PK
        uuid collection_id FK
        uuid image_id FK
        timestamp added_at
    }
```

---

## 2. Các Ràng Buộc Kỹ Thuật Quan Trọng

1. **Credit Atomic Update**: Khi trừ credit để tạo ảnh hoặc cộng credit sau thanh toán, bắt buộc sử dụng cơ chế khóa dòng (`SELECT ... FOR UPDATE`) hoặc câu lệnh nguyên tử:
   ```sql
   UPDATE users 
   SET credits_balance = credits_balance - 1 
   WHERE id = $1 AND credits_balance >= 1;
   ```
2. **Indexing**:
   - `users(email)`: B-Tree Unique Index.
   - `images(user_id, created_at DESC)`: Composite Index cho truy vấn phân trang ảnh của cá nhân.
   - `images(is_public, created_at DESC)`: Composite Index phục vụ trang Khám phá (Public Explore Feed).
   - `transactions(stripe_session_id)`: B-Tree Unique Index để phòng chống tấn công thanh toán trùng lặp (Idempotency).
