# 🛡️ Chính Sách Bảo Vệ Nhánh (Branch Protection Rules)

Để đảm bảo không ai có thể vô tình hoặc cố ý làm hỏng môi trường Staging hay Production, quy tắc bảo vệ nhánh (Branch Protection) phải được kích hoạt trên GitHub / GitLab Repository.

---

## 1. Cấu Hình Trên Nhánh `prod`

Trên giao diện **GitHub Settings -> Branches -> Add branch protection rule**:
- **Branch name pattern**: `prod`
- ✅ **Require a pull request before merging**: Bắt buộc mọi thay đổi phải qua Pull Request.
  - ✅ **Require approvals**: Tối thiểu **2 reviews** được chấp thuận (Approved) từ Tech Lead / Senior Dev.
  - ✅ **Dismiss stale pull request approvals when new commits are pushed**: Tự động hủy phê duyệt cũ nếu tác giả push thêm code mới.
- ✅ **Require status checks to pass before merging**:
  - Bắt buộc vượt qua bộ kiểm thử CI (`test`, `lint`, `security-audit`).
  - ✅ **Require branches to be up to date before merging**: Nhánh PR phải rebase/merge code mới nhất của `prod`.
- ✅ **Require linear history**: Giữ lịch sử commit dạng đường thẳng, không tạo merge loops phức tạp.
- ✅ **Do not allow bypassing the above settings**: Áp dụng nghiêm ngặt cho cả Administrators.

---

## 2. Cấu Hình Trên Nhánh `staging`

- **Branch name pattern**: `staging`
- ✅ **Require a pull request before merging**: Bắt buộc qua PR từ `dev` hoặc `prod` (hotfix sync).
  - ✅ **Require approvals**: Tối thiểu **1 approval** từ QA Lead hoặc Developer.
  - ✅ **Require status checks to pass before merging**: Pass CI build.

---

## 3. Cấu Hình Trên Nhánh `dev`

- **Branch name pattern**: `dev`
- ✅ **Require a pull request before merging**: Bắt buộc tạo PR từ các nhánh `feat/*`.
  - ✅ **Require approvals**: Tối thiểu **1 review** từ đồng nghiệp trong team.
  - ✅ **Require status checks to pass**: Pass CI Linting & Unit tests.

---

## 4. Bảo Vệ Tại Máy Lập Trình Viên Cục Bộ (Local Git Hook)

Dự án đã tích hợp sẵn script hook `.githooks/pre-push`. Khi lập trình viên cố tình chạy:
```bash
git push origin prod
# hoặc
git push origin staging
```
Hook sẽ lập tức can thiệp và từ chối:
```text
================================================================================
🚫 CẢNH BÁO BẢO VỆ NHÁNH: KHÔNG ĐƯỢC PHÉP PUSH TRỰC TIẾP!
================================================================================
Nhánh đích được bảo vệ: refs/heads/prod
👉 QUY TRÌNH BẮT BUỘC:
   1. Push code lên nhánh phụ (feat/... hoặc hotfix/...)
   2. Tạo Pull Request (PR) để Review code & Kiểm thử
   3. Chỉ merge vào 'prod' khi đã được Approve đầy đủ!
================================================================================
```
