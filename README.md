# ✨ GPT-Images Platform

> Nền tảng sáng tạo hình ảnh ứng dụng Generative AI thế hệ mới, vận hành theo mô hình **Agile Scrum Framework** tối ưu hóa bởi Scrum Master, tích hợp quy chuẩn phân nhánh **Gitflow** chuẩn doanh nghiệp, kiểm soát chất lượng qua **Definition of Ready (DoR) / Definition of Done (DoD)**, và hệ thống tài liệu phân rã chuyên sâu theo **nghiệp vụ sản phẩm (Business Domains)**.

---

## 📌 1. Khung Vận Hành Sprint 2 Tuần & Gitflow

Dự án áp dụng chu kỳ Sprint 2 tuần (10 ngày làm việc), gắn kết trực tiếp với các nhánh trong Gitflow:

```text
[Sprint Backlog] ──> [feat/GPT-xxx] ──(PR)──> [dev] ──(Merge Day 8)──> [staging] ──(Demo & Release)──> [prod] (vX.Y.0)
                                                ▲                         ▲                                 │
                                                │                         │                                 ▼
                                                └────────(Reverse Sync)───┴─────────(Sync)────────── [hotfix/*]
```

- **`prod`**: Nhánh Production chính thức, gắn các Release Tags tương ứng với từng Product Increment sau Sprint Demo (`v1.0.0`, `v1.0.1`,...).
- **`staging`**: Môi trường Staging phục vụ QA kiểm thử và thực hiện **Live Demo tại Sprint Review**.
- **`dev`**: Nhánh tích hợp liên tục (Continuous Integration) trong suốt thời gian Sprint diễn ra.
- **`feat/GPT-xxx-<tên-tính-năng>`**: Nhánh phát triển User Story (tách từ `dev`).
- **`hotfix/<tên-lỗi>`**: Nhánh xử lý sự cố khẩn cấp trên Production (tách từ `prod`).

---

## 🎯 2. Chốt Chặn Chất Lượng Agile (DoR & DoD)

- **Definition of Ready (DoR)**: User Story phải có đầy đủ định dạng Agile (`Là một... Tôi muốn... Để...`), Acceptance Criteria dạng **Gherkin (Given-When-Then)**, wireframe UI, và đã được ước lượng Story Points (Fibonacci <= 8 SP) trước khi đưa vào Sprint.
- **Definition of Done (DoD)**: Để hoàn thành User Story, mã nguồn phải có Unit Test coverage >= 80%, pass CI/CD, có PR review approval, đã deploy và pass kiểm thử trên môi trường **`staging`**, và được PO nghiệm thu tại buổi Sprint Review.

---

## 🏷️ 3. Quy Chuẩn Commit (Conventional Commits + Issue ID)

Mọi commit **bắt buộc** tuân thủ cú pháp:

```text
<type>[optional scope]: <description> #<issue_id>
```

- **Độ dài tiêu đề**: Tối đa **50 ký tự** (không vượt quá 72 ký tự).
- **Không dùng dấu chấm (`.`)** ở cuối dòng tiêu đề.
- **Bắt buộc có Issue ID** (Ví dụ: `#GPT-101`, `#HOTFIX-201`, `#123`).
- **Các Type hợp lệ**: `feat`, `fix`, `refactor`, `docs`, `chore`, `style`, `perf`, `vendor`, `test`.

### Kích hoạt Git Hooks bảo vệ cục bộ:
Chạy lệnh sau để tự động kiểm soát commit message và chặn push trực tiếp vào `prod`/`staging`:
```bash
git config core.hooksPath .githooks
```

---

## 📚 4. Hệ Sinh Thái Tài Liệu Nghiệp Vụ & Agile (`DOCS/`)

Hệ thống tài liệu được phân tách khoa học thành 6 phân hệ tại thư mục [`DOCS/`](DOCS/README.md):

| Phân hệ tài liệu | Thư mục | Nội dung trọng tâm |
| :--- | :--- | :--- |
| **00 - Khung Quản Trị Agile Scrum** | [`DOCS/00-agile-scrum-framework/`](DOCS/00-agile-scrum-framework/README.md) | Chu kỳ Sprint 2 tuần, DoR, DoD, ước lượng Story Points (Fibonacci), 4 lễ hội Scrum, xử lý Blocker & Hotfix. |
| **01 - Quy Chuẩn Gitflow & Kỹ Thuật** | [`DOCS/01-quy-chuan-phat-trien-git/`](DOCS/01-quy-chuan-phat-trien-git/README.md) | Mô hình phân nhánh Gitflow, chuẩn commit message, quy trình Review PR, kịch bản Hotfix & Lab thực hành. |
| **02 - Nghiệp Vụ Sản Phẩm** | [`DOCS/02-nghiep-vu-san-pham/`](DOCS/02-nghiep-vu-san-pham/README.md) | Phân rã 4 Business Domains (Auth, AI Generator, Gallery, Billing) và Luồng người dùng End-to-End. |
| **03 - Kiến Trúc Hệ Thống** | [`DOCS/03-thiet-ke-kien-truc-he-thong/`](DOCS/03-thiet-ke-kien-truc-he-thong/README.md) | Kiến trúc tổng thể 3-tier, chuẩn REST API JSON contracts và cơ sở dữ liệu quan hệ (ERD). |
| **04 - Vận Hành & Hạ Tầng** | [`DOCS/04-van-hanh-va-ha-tang/`](DOCS/04-van-hanh-va-ha-tang/README.md) | Ma trận môi trường (Dev/Staging/Prod), cấu hình Branch Protection và pipeline CI/CD tự động. |
| **05 - Bộ Biểu Mẫu Scrum Templates** | [`DOCS/05-bieu-mau-scrum-templates/`](DOCS/05-bieu-mau-scrum-templates/README.md) | Bộ mẫu: Biên bản Sprint Planning, Nhật ký Daily Standup, Kịch bản Demo Sprint Review, và Sprint Retrospective. |

---

## 🚀 5. Cấu Trúc Mã Nguồn (Project Structure)

```text
gpt-images/
├── .github/                     # Mẫu PR và Issue Templates (Agile User Story, Spike, Bug)
│   ├── ISSUE_TEMPLATE/
│   │   ├── bug_report.yml
│   │   ├── feature_request.yml
│   │   ├── spike_task.yml
│   │   └── user_story.yml
│   └── pull_request_template.md # PR Template tích hợp DoD Checklist
├── .githooks/                   # Git automation hooks (commit-msg, pre-push)
│   ├── commit-msg
│   └── pre-push
├── BE/                          # Mã nguồn tầng Backend (APIs, AI Integration)
├── FE/                          # Mã nguồn tầng Frontend (Landing page, Web app)
│   ├── index.html
│   └── style.css
├── DOCS/                        # Tài liệu phân rã theo 6 phân hệ Agile & Nghiệp vụ
└── README.md                    # Hướng dẫn tổng quan nền tảng
```
