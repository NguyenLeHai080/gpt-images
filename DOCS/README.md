# 📚 Cổng Tài Liệu Hệ Thống & Quản Trị Agile Scrum (Master DOCS Portal)

Chào mừng bạn đến với trung tâm tài liệu kỹ thuật, quản trị vận hành và nghiệp vụ dự án **GPT-Images**. 

Hệ sinh thái tài liệu được cấu trúc và tối ưu hóa dưới góc nhìn **Scrum Master (Agile Coach)**: kết nối chu kỳ phát triển linh hoạt (Agile Scrum) với quy chuẩn phân nhánh Gitflow, chốt chặn chất lượng (DoR/DoD), phân rã nghiệp vụ sản phẩm và bộ biểu mẫu tác nghiệp thực tế.

---

## 🗺️ Bản Đồ Điều Hướng Tài Liệu (Agile & Engineering Matrix)

```text
DOCS/
├── 📁 00-agile-scrum-framework/          --> Khung quản trị Sprint 2 tuần, DoR, DoD, Velocity & 4 Lễ hội Scrum
├── 📁 01-quy-chuan-phat-trien-git/        --> Tiêu chuẩn Gitflow, Conventional Commits, PR Review & Hotfix
├── 📁 02-nghiep-vu-san-pham/             --> Phân rã 4 Business Domains (Auth, AI Engine, Gallery, Billing)
├── 📁 03-thiet-ke-kien-truc-he-thong/     --> Kiến trúc 3-tier, chuẩn REST API JSON & Cơ sở dữ liệu ERD
├── 📁 04-van-hanh-va-ha-tang/             --> Ma trận môi trường (Dev/Staging/Prod), Bảo vệ nhánh & CI/CD
└── 📁 05-bieu-mau-scrum-templates/        --> Bộ biểu mẫu tác nghiệp Scrum: Planning, Standup, Demo, Retro
```

---

## 📑 Danh Mục Chi Tiết Từng Phân Hệ Tài Liệu

### 1. [00 - Khung Quản Trị Agile Scrum Framework](file:///e:/Projects/gpt-images/DOCS/00-agile-scrum-framework/README.md)
*Trọng tâm: Chu kỳ Sprint, cam kết chất lượng và nhịp điệu phát triển*
- **[01-scrum-process-and-sprint-cadence.md](file:///e:/Projects/gpt-images/DOCS/00-agile-scrum-framework/01-scrum-process-and-sprint-cadence.md)**: Chu kỳ Sprint 2 tuần (10 ngày) và bản đồ ánh xạ trực tiếp với các nhánh Gitflow (`dev`, `staging`, `prod`).
- **[02-definition-of-ready-and-done.md](file:///e:/Projects/gpt-images/DOCS/00-agile-scrum-framework/02-definition-of-ready-and-done.md)**: Bộ tiêu chuẩn chất lượng: DoR cho Product Owner và DoD cho Development Team.
- **[03-estimation-and-capacity-planning.md](file:///e:/Projects/gpt-images/DOCS/00-agile-scrum-framework/03-estimation-and-capacity-planning.md)**: Quy tắc ước lượng Story Points (Fibonacci), Planning Poker, Velocity và kiểm soát WIP Limit.
- **[04-scrum-ceremonies-guide.md](file:///e:/Projects/gpt-images/DOCS/00-agile-scrum-framework/04-scrum-ceremonies-guide.md)**: Hướng dẫn vận hành 4 lễ hội Scrum: Sprint Planning, Daily Scrum, Sprint Review và Sprint Retrospective.
- **[05-impediment-and-risk-management.md](file:///e:/Projects/gpt-images/DOCS/00-agile-scrum-framework/05-impediment-and-risk-management.md)**: Quy trình tháo gỡ Blocker trong 2-4 giờ, ngăn chặn Scope Creep và xử lý Hotfix trong Sprint.

---

### 2. [01 - Quy Chuẩn Phát Triển Gitflow & Kỹ Thuật](file:///e:/Projects/gpt-images/DOCS/01-quy-chuan-phat-trien-git/README.md)
*Trọng tâm: Kỹ thuật quản lý mã nguồn và tự động hóa kiểm soát*
- **[01-gitflow-branching-model.md](file:///e:/Projects/gpt-images/DOCS/01-quy-chuan-phat-trien-git/01-gitflow-branching-model.md)**: Mô hình 3 nhánh vĩnh viễn (`prod`, `staging`, `dev`) và quy tắc nhánh phụ (`feat/*`, `hotfix/*`).
- **[02-conventional-commits-issue-tracking.md](file:///e:/Projects/gpt-images/DOCS/01-quy-chuan-phat-trien-git/02-conventional-commits-issue-tracking.md)**: Cú pháp commit message chuẩn, bắt buộc kèm Issue ID, nguyên tắc 50 ký tự.
- **[03-code-review-va-pull-request.md](file:///e:/Projects/gpt-images/DOCS/01-quy-chuan-phat-trien-git/03-code-review-va-pull-request.md)**: Quy trình mở PR, checklist review và điều kiện merge.
- **[04-quy-trinh-hotfix-khan-cap.md](file:///e:/Projects/gpt-images/DOCS/01-quy-chuan-phat-trien-git/04-quy-trinh-hotfix-khan-cap.md)**: Quy trình xử lý lỗi khẩn cấp trực tiếp từ `prod` và đồng bộ ngược về `staging`, `dev`.
- **[05-huong-dan-thuc-hanh-hands-on.md](file:///e:/Projects/gpt-images/DOCS/01-quy-chuan-phat-trien-git/05-huong-dan-thuc-hanh-hands-on.md)**: Bài thực hành chi tiết từng câu lệnh Git mẫu từ A - Z.

---

### 3. [02 - Nghiệp Vụ Sản Phẩm (Product Business Domains)](file:///e:/Projects/gpt-images/DOCS/02-nghiep-vu-san-pham/README.md)
*Trọng tâm: Đặc tả yêu cầu nghiệp vụ và hành vi người dùng cuối*
- **[01-tong-quan-nghiep-vu.md](file:///e:/Projects/gpt-images/DOCS/02-nghiep-vu-san-pham/01-tong-quan-nghiep-vu.md)**: Tầm nhìn sản phẩm GPT-Images, User Personas và các chỉ số đo lường hiệu quả (KPIs).
- **[02-phan-ra-chuc-nang-business-domains.md](file:///e:/Projects/gpt-images/DOCS/02-nghiep-vu-san-pham/02-phan-ra-chuc-nang-business-domains.md)**: Phân rã 4 phân hệ cốt lõi: Xác thực tài khoản, AI Sinh ảnh, Thư viện lưu trữ, và Quản lý thanh toán/Credit.
- **[03-luong-nghiep-vu-business-flows.md](file:///e:/Projects/gpt-images/DOCS/02-nghiep-vu-san-pham/03-luong-nghiep-vu-business-flows.md)**: Sơ đồ luồng người dùng End-to-End (Tạo ảnh từ Prompt, Nạp tiền mua Credit).

---

### 4. [03 - Thiết Kế Kiến Trúc Hệ Thống](file:///e:/Projects/gpt-images/DOCS/03-thiet-ke-kien-truc-he-thong/README.md)
*Trọng tâm: Kiến trúc phần mềm, hợp đồng API và cơ sở dữ liệu*
- **[01-kien-truc-tong-the.md](file:///e:/Projects/gpt-images/DOCS/03-thiet-ke-kien-truc-he-thong/01-kien-truc-tong-the.md)**: Sơ đồ kiến trúc 3 tầng tách biệt giữa Frontend (`FE`), Backend (`BE`), Cloudflare R2 / AWS S3 và AI Gateway.
- **[02-dac-ta-api-contracts.md](file:///e:/Projects/gpt-images/DOCS/03-thiet-ke-kien-truc-he-thong/02-dac-ta-api-contracts.md)**: Đặc tả toàn bộ chuẩn RESTful API JSON cho Auth, Images, Gallery và Billing.
- **[03-mo-hinh-du-lieu.md](file:///e:/Projects/gpt-images/DOCS/03-thiet-ke-kien-truc-he-thong/03-mo-hinh-du-lieu.md)**: Sơ đồ thực thể quan hệ (ERD) và cơ chế khóa dòng nguyên tử chống race condition.

---

### 5. [04 - Vận Hành & Hạ Tầng (Operations & DevOps)](file:///e:/Projects/gpt-images/DOCS/04-van-hanh-va-ha-tang/README.md)
*Trọng tâm: Quản trị môi trường, an toàn hệ thống và tự động hóa CI/CD*
- **[01-ma-tran-moi-truong.md](file:///e:/Projects/gpt-images/DOCS/04-van-hanh-va-ha-tang/01-ma-tran-moi-truong.md)**: Ma trận 3 môi trường phân định rõ mục đích: Development, Staging và Production.
- **[02-chinh-sach-bao-ve-nhanh.md](file:///e:/Projects/gpt-images/DOCS/04-van-hanh-va-ha-tang/02-chinh-sach-bao-ve-nhanh.md)**: Hướng dẫn thiết lập Branch Protection Rules trên GitHub và hook bảo vệ cục bộ.
- **[03-quy-trinh-ci-cd.md](file:///e:/Projects/gpt-images/DOCS/04-van-hanh-va-ha-tang/03-quy-trinh-ci-cd.md)**: Pipeline CI/CD tự động kiểm thử lint, test, build và triển khai Zero-Downtime.

---

### 6. [05 - Bộ Biểu Mẫu Tác Nghiệp Scrum (Scrum Templates)](file:///e:/Projects/gpt-images/DOCS/05-bieu-mau-scrum-templates/README.md)
*Trọng tâm: Các công cụ biểu mẫu thực hành hàng ngày của Scrum Master*
- **[01-sprint-planning-template.md](file:///e:/Projects/gpt-images/DOCS/05-bieu-mau-scrum-templates/01-sprint-planning-template.md)**: Mẫu kế hoạch Sprint Planning (Sprint Goal, Capacity, Committed Backlog).
- **[02-daily-standup-board-template.md](file:///e:/Projects/gpt-images/DOCS/05-bieu-mau-scrum-templates/02-daily-standup-board-template.md)**: Mẫu theo dõi 15 phút Daily Standup, danh sách Blockers và điểm tự tin.
- **[03-sprint-review-and-demo-template.md](file:///e:/Projects/gpt-images/DOCS/05-bieu-mau-scrum-templates/03-sprint-review-and-demo-template.md)**: Mẫu kịch bản Live Demo trên Staging và biên bản nghiệm thu sản phẩm.
- **[04-sprint-retrospective-template.md](file:///e:/Projects/gpt-images/DOCS/05-bieu-mau-scrum-templates/04-sprint-retrospective-template.md)**: Mẫu điều phối Retrospective (Glad - Sad - Mad) và bảng phân công Action Items.
