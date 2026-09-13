## 📌 Liên Kết User Story / Issue
- **Sprint**: Sprint `[Điền số Sprint]`
- **Issue ID**: Close # <!-- Điền ID User Story, ví dụ: #GPT-101 hoặc #HOTFIX-201 -->
- **Story Points**: `[1 / 2 / 3 / 5 / 8 SP]`

---

## 🚀 Loại Thay Đổi (Type of Change)
Vui lòng đánh dấu `[x]` vào mục tương ứng:
- [ ] `feat`: Tính năng mới đáp ứng User Story
- [ ] `fix`: Vá lỗi phát hiện trong quá trình kiểm thử
- [ ] `refactor`: Tái cấu trúc mã nguồn (không đổi logic)
- [ ] `perf`: Cải tiến hiệu năng hệ thống
- [ ] `docs`: Bổ sung hoặc cập nhật tài liệu DOCS
- [ ] `chore`: Cấu hình dependencies, build tools
- [ ] `hotfix`: Sửa lỗi khẩn cấp trực tiếp cho Production

---

## 📝 Tóm Tắt Giải Pháp Kỹ Thuật (Solution Summary)
<!-- Mô tả ngắn gọn cách bạn giải quyết vấn đề và các file mã nguồn cốt lõi đã thay đổi -->

---

## ✅ Tiêu Chuẩn Hoàn Thành (Definition of Done - DoD Checklist)
> [!IMPORTANT]
> **Tác giả PR và Reviewer bắt buộc phải kiểm tra và đánh dấu đầy đủ trước khi Merge!**

### 1. Về Mã Nguồn & Kiểm Thử Tự Động (Code & Unit Tests):
- [ ] Nhánh tạo theo chuẩn: `feat/GPT-xxx-...` hoặc `hotfix/xxx`.
- [ ] Toàn bộ commit message tuân thủ **Conventional Commits + Issue ID**.
- [ ] Đã viết hoặc cập nhật Unit Test với độ bao phủ (Coverage) >= 80%.
- [ ] Không còn file rác, comment thừa, hoặc `console.log` debug.
- [ ] Toàn bộ pipeline kiểm tra tự động trên CI (Linter, Typecheck, Build) đều xanh (Passed).

### 2. Về Nghiệp Vụ & Nghiệm Thu (Acceptance Criteria):
- [ ] Đã đối chiếu và thỏa mãn **100% Acceptance Criteria** được quy định trong Issue.
- [ ] Đã đính kèm ảnh chụp màn hình / GIF bằng chứng kiểm thử hoạt động ở bên dưới.

### 3. Về Tài Liệu (Documentation):
- [ ] Đã cập nhật tài liệu tương ứng trong thư mục [`DOCS/`](DOCS/README.md) nếu có thay đổi về API Contract hoặc cấu hình.

---

## 📸 Bằng Chứng Kiểm Thử (Testing Evidence)
<!-- Dán ảnh chụp màn hình, kết quả chạy unit test, hoặc GIF demo tại đây -->
