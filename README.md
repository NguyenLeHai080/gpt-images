# ✨ GPT-Images Platform

> Nền tảng sáng tạo hình ảnh ứng dụng Generative AI thế hệ mới, áp dụng mô hình phân nhánh **Gitflow** chuẩn doanh nghiệp, kiểm soát chất lượng qua **Conventional Commits & Issue Tracking**, và hệ thống tài liệu phân rã theo **phân hệ nghiệp vụ (Business Domains)**.

---

## 📌 1. Cấu Trúc Nhánh Git (Gitflow Workflow)

Dự án áp dụng mô hình Gitflow với 3 nhánh vĩnh viễn và các nhánh tạm thời:

```text
[feat/*]   ──(PR)──>  [dev]   ──(Merge)──>  [staging]   ──(Release PR)──>  [prod]
                        ▲                      ▲                                │
                        │                      │                                ▼
                        └──────(Sync)──────────┴─────────(Sync)────────── [hotfix/*]
```

- **`prod`**: Chứa mã nguồn thực tế đang chạy trên Production (Khóa push trực tiếp).
- **`staging`**: Môi trường kiểm thử QA, UAT và demo trước khi release.
- **`dev`**: Nhánh tích hợp trung tâm của các lập trình viên.
- **`feat/<tên-tính-năng>`**: Nhánh phát triển tính năng mới (tách từ `dev`).
- **`hotfix/<tên-lỗi>`**: Nhánh sửa lỗi khẩn cấp trực tiếp cho Production (tách từ `prod`).

---

## 🏷️ 2. Quy Chuẩn Commit (Conventional Commits + Issue ID)

Mọi commit **bắt buộc** tuân thủ cú pháp:

```text
<type>[optional scope]: <description> #<issue_id>
```

- **Độ dài tiêu đề**: Tối đa **50 ký tự** (không vượt quá 72 ký tự).
- **Không dùng dấu chấm (`.`)** ở cuối dòng tiêu đề.
- **Bắt buộc có Issue ID** (Ví dụ: `#GPT-101`, `#HOTFIX-201`, `#123`).
- **Các Type hợp lệ**:
  - `feat`: Thêm tính năng mới (Feature)
  - `fix`: Sửa lỗi hệ thống / bug fix
  - `refactor`: Tái cấu trúc code (không đổi tính năng)
  - `docs`: Cập nhật tài liệu
  - `chore`: Việc phụ trợ (cấu hình, công cụ, packages)
  - `style`: Định dạng code, giao diện CSS
  - `perf`: Tối ưu hóa hiệu năng
  - `vendor`: Cập nhật phiên bản dependencies bên thứ ba
  - `test`: Viết bài kiểm thử unit/integration test

### Kích hoạt Git Hooks bảo vệ cục bộ:
Sau khi clone dự án về máy, hãy chạy lệnh sau để tự động kích hoạt bộ kiểm tra commit và bảo vệ nhánh:
```bash
git config core.hooksPath .githooks
```

---

## 📚 3. Bản Đồ Tài Liệu Nghiệp Vụ (DOCS Matrix)

Hệ thống tài liệu được phân chia theo từng nghiệp vụ chuyên sâu tại thư mục [`DOCS/`](DOCS/README.md):

| Phân hệ tài liệu | Thư mục | Nội dung trọng tâm |
| :--- | :--- | :--- |
| **01 - Quy chuẩn Git & Vòng đời** | [`DOCS/01-quy-chuan-phat-trien-git/`](DOCS/01-quy-chuan-phat-trien-git/README.md) | Chiến lược phân nhánh, chuẩn commit, quy trình Review PR, kịch bản Hotfix & Lab thực hành. |
| **02 - Nghiệp vụ Sản phẩm** | [`DOCS/02-nghiep-vu-san-pham/`](DOCS/02-nghiep-vu-san-pham/README.md) | Phân rã 4 Business Domains (Auth, AI Generator, Gallery, Billing) và Luồng người dùng. |
| **03 - Kiến trúc Hệ thống** | [`DOCS/03-thiet-ke-kien-truc-he-thong/`](DOCS/03-thiet-ke-kien-truc-he-thong/README.md) | Kiến trúc tổng thể 3-tier, chuẩn REST API contracts và cơ sở dữ liệu quan hệ (ERD). |
| **04 - Vận hành & Hạ tầng** | [`DOCS/04-van-hanh-va-ha-tang/`](DOCS/04-van-hanh-va-ha-tang/README.md) | Ma trận môi trường (Dev/Staging/Prod), cấu hình Branch Protection và quy trình CI/CD. |

---

## 🚀 4. Cấu Trúc Mã Nguồn (Project Structure)

```text
gpt-images/
├── .github/                     # Mẫu PR và Issue Templates
│   ├── ISSUE_TEMPLATE/
│   └── pull_request_template.md
├── .githooks/                   # Git automation hooks (commit-msg, pre-push)
│   ├── commit-msg
│   └── pre-push
├── BE/                          # Mã nguồn tầng Backend (APIs, AI Integration)
├── FE/                          # Mã nguồn tầng Frontend (Landing page, Web app)
│   ├── index.html
│   └── style.css
├── DOCS/                        # Tài liệu phân rã theo phân hệ nghiệp vụ
└── README.md                    # Hướng dẫn tổng quan
```
