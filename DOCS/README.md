# 📚 Cổng Tài Liệu Hệ Thống & Nghiệp Vụ (DOCS Portal)

Chào mừng bạn đến với trung tâm tài liệu kỹ thuật và nghiệp vụ dự án **GPT-Images**. Tài liệu tại đây được phân loại theo từng phân hệ nghiệp vụ và tiêu chuẩn phát triển phần mềm chuẩn doanh nghiệp.

---

## 🗺️ Bản đồ Điều hướng Tài liệu (Documentation Index)

```
DOCS/
├── 📁 01-quy-chuan-phat-trien-git/        --> Tiêu chuẩn Gitflow, Commit, PR & Quy trình Hotfix
├── 📁 02-nghiep-vu-san-pham/             --> Phân rã nghiệp vụ & Luồng người dùng (Business Specs)
├── 📁 03-thiet-ke-kien-truc-he-thong/     --> Kiến trúc kỹ thuật, API Contracts & Cơ sở dữ liệu
└── 📁 04-van-hanh-va-ha-tang/             --> Quản trị môi trường, Bảo vệ nhánh & CI/CD
```

---

## 📑 Chi tiết các phân hệ tài liệu

### 1. [01 - Quy chuẩn Phát triển & Gitflow](file:///e:/Projects/gpt-images/DOCS/01-quy-chuan-phat-trien-git/README.md)
Phân hệ này định nghĩa cách thức đội ngũ kỹ sư phối hợp trên Git, quy chuẩn phân nhánh và kiểm soát chất lượng mã nguồn:
- **[01-gitflow-branching-model.md](file:///e:/Projects/gpt-images/DOCS/01-quy-chuan-phat-trien-git/01-gitflow-branching-model.md)**: Cấu trúc 3 nhánh chính (`prod`, `staging`, `dev`) và quy tắc nhánh phụ (`feat/*`, `hotfix/*`).
- **[02-conventional-commits-issue-tracking.md](file:///e:/Projects/gpt-images/DOCS/01-quy-chuan-phat-trien-git/02-conventional-commits-issue-tracking.md)**: Chuẩn viết commit message, bắt buộc kèm Issue ID, nguyên tắc 50 ký tự.
- **[03-code-review-va-pull-request.md](file:///e:/Projects/gpt-images/DOCS/01-quy-chuan-phat-trien-git/03-code-review-va-pull-request.md)**: Quy trình tạo PR, Checklist Review và điều kiện merge.
- **[04-quy-trinh-hotfix-khan-cap.md](file:///e:/Projects/gpt-images/DOCS/01-quy-chuan-phat-trien-git/04-quy-trinh-hotfix-khan-cap.md)**: Quy trình xử lý lỗi khẩn cấp trực tiếp từ `prod` và đồng bộ ngược về `staging`, `dev`.
- **[05-huong-dan-thuc-hanh-hands-on.md](file:///e:/Projects/gpt-images/DOCS/01-quy-chuan-phat-trien-git/05-huong-dan-thuc-hanh-hands-on.md)**: Bài tập thực hành thực tế mô phỏng từng câu lệnh Git.

---

### 2. [02 - Nghiệp vụ Sản phẩm (Business Domains)](file:///e:/Projects/gpt-images/DOCS/02-nghiep-vu-san-pham/README.md)
Tập hợp toàn bộ yêu cầu nghiệp vụ, tính năng giải pháp và luồng trải nghiệm khách hàng:
- **[01-tong-quan-nghiep-vu.md](file:///e:/Projects/gpt-images/DOCS/02-nghiep-vu-san-pham/01-tong-quan-nghiep-vu.md)**: Giới thiệu nền tảng GPT-Images, đối tượng sử dụng và bài toán giải quyết.
- **[02-phan-ra-chuc-nang-business-domains.md](file:///e:/Projects/gpt-images/DOCS/02-nghiep-vu-san-pham/02-phan-ra-chuc-nang-business-domains.md)**: Phân rã 4 Domain nghiệp vụ lõi (Auth, AI Generation, Gallery Storage, Billing).
- **[03-luong-nghiep-vu-business-flows.md](file:///e:/Projects/gpt-images/DOCS/02-nghiep-vu-san-pham/03-luong-nghiep-vu-business-flows.md)**: Sơ đồ luồng nghiệp vụ từ đăng ký, mua credit, tạo ảnh bằng Prompt tới lưu trữ.

---

### 3. [03 - Thiết kế Kiến trúc Hệ thống](file:///e:/Projects/gpt-images/DOCS/03-thiet-ke-kien-truc-he-thong/README.md)
Kiến trúc hệ thống kỹ thuật chi tiết:
- **[01-kien-truc-tong-the.md](file:///e:/Projects/gpt-images/DOCS/03-thiet-ke-kien-truc-he-thong/01-kien-truc-tong-the.md)**: Phân tầng Frontend (`FE`), Backend (`BE`), AI Gateway & Storage Cloud.
- **[02-dac-ta-api-contracts.md](file:///e:/Projects/gpt-images/DOCS/03-thiet-ke-kien-truc-he-thong/02-dac-ta-api-contracts.md)**: Đặc tả chuẩn REST API giữa Frontend và Backend.
- **[03-mo-hinh-du-lieu.md](file:///e:/Projects/gpt-images/DOCS/03-thiet-ke-kien-truc-he-thong/03-mo-hinh-du-lieu.md)**: Mô hình thực thể quan hệ cơ sở dữ liệu (ERD, Schemas).

---

### 4. [04 - Vận hành & Hạ tầng (Operations & DevOps)](file:///e:/Projects/gpt-images/DOCS/04-van-hanh-va-ha-tang/README.md)
Môi trường, an toàn hệ thống và tự động hóa:
- **[01-ma-tran-moi-truong.md](file:///e:/Projects/gpt-images/DOCS/04-van-hanh-va-ha-tang/01-ma-tran-moi-truong.md)**: Ma trận cấu hình Dev, Staging và Production.
- **[02-chinh-sach-bao-ve-nhanh.md](file:///e:/Projects/gpt-images/DOCS/04-van-hanh-va-ha-tang/02-chinh-sach-bao-ve-nhanh.md)**: Hướng dẫn cấu hình Branch Protection trên GitHub nhằm ngăn chặn rủi ro push trực tiếp.
- **[03-quy-trinh-ci-cd.md](file:///e:/Projects/gpt-images/DOCS/04-van-hanh-va-ha-tang/03-quy-trinh-ci-cd.md)**: Kịch bản CI/CD tự động build, test và deploy theo từng nhánh.
