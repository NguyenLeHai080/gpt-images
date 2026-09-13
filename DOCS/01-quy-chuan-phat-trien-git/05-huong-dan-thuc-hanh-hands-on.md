# 🛠️ Hướng Dẫn Thực Hành Gitflow Từ A - Z (Hands-on Lab)

Tài liệu này cung cấp kịch bản thực hành toàn diện giúp các lập trình viên mới nắm vững các thao tác Git, phân nhánh, xử lý PR và giải quyết tình huống Hotfix trong thực tế dự án `gpt-images`.

---

## 1. Bảng Tra Cứu Lệnh Git Cơ Bản (Cheat Sheet)

| Lệnh | Mô tả hành động |
| :--- | :--- |
| `git init` | Khởi tạo repository Git tại thư mục hiện tại. |
| `git clone <url>` | Sao chép repository từ remote (GitHub/GitLab) về máy tính. |
| `git status` | Xem trạng thái các file đang thay đổi, unstaged hoặc staged. |
| `git add <file>` hoặc `git add .` | Đưa file vào Staging Area chuẩn bị commit. |
| `git commit -m "<message>"` | Lưu lại snapshot thay đổi kèm commit message. |
| `git checkout -b <branch>` | Tạo nhánh mới và chuyển sang nhánh đó ngay. |
| `git checkout <branch>` hoặc `git switch <branch>` | Chuyển đổi giữa các nhánh có sẵn. |
| `git pull origin <branch>` | Kéo và gộp những cập nhật mới nhất từ remote về local. |
| `git push -u origin <branch>` | Đẩy nhánh và commit từ local lên remote repository. |
| `git merge <branch>` | Trộn (merge) lịch sử từ nhánh chỉ định vào nhánh hiện tại. |
| `git log --graph --oneline --all` | Xem lịch sử commit dạng cây phân nhánh trực quan. |

---

## 2. Kịch Bản Thực Hành 1: Thêm Tính Năng Mới (Feature Flow)

### Tình huống:
Được giao nhiệm vụ phát triển trang chủ (Landing Page) cho dự án GPT-Images, mã công việc là **#GPT-101**.

```bash
# 1. Chuyển sang nhánh dev và lấy code mới nhất
git checkout dev
git pull origin dev

# 2. Tạo nhánh tính năng từ dev
git checkout -b feat/homepage

# 3. Tạo/chỉnh sửa file giao diện (ví dụ: FE/index.html)
# Sau khi sửa xong, kiểm tra trạng thái:
git status

# 4. Đưa file vào staging và commit chuẩn Conventional Commits
git add FE/index.html
git commit -m "feat(landing): add modern homepage interface #GPT-101"

# 5. Push nhánh tính năng lên remote
git push -u origin feat/homepage

# 6. (Mô phỏng Merge vào dev sau khi PR được approve)
git checkout dev
git merge feat/homepage --no-ff -m "Merge branch 'feat/homepage' into dev #GPT-101"
```

---

## 3. Kịch Bản Thực Hành 2: Đưa Code Lên Staging Để Kiểm Thử (QA Flow)

### Tình huống:
Sau khi các tính năng trên `dev` đã hoàn thành và tích hợp xong, đưa sang `staging` để đội ngũ QA tiến hành kiểm thử.

```bash
# 1. Chuyển sang staging và kéo mã mới
git checkout staging
git pull origin staging

# 2. Merge dev vào staging
git merge dev --no-ff -m "chore(release): integrate dev changes into staging for QA #QA-RELEASE"

# 3. Push lên staging
git push origin staging
```

---

## 4. Kịch Bản Thực Hành 3: Triển Khai Production (Release Flow)

### Tình huống:
Sau khi QA kiểm thử và xác nhận đạt yêu cầu trên `staging`, tiến hành đưa lên môi trường `prod`.

```bash
# 1. Chuyển sang prod
git checkout prod
git pull origin prod

# 2. Merge staging vào prod
git merge staging --no-ff -m "chore(release): deploy v1.0.0 to production #RELEASE-100"

# 3. Đánh tag phiên bản
git tag -a v1.0.0 -m "Release version 1.0.0"

# 4. Push lên prod kèm tag
git push origin prod --tags
```

---

## 5. Kịch Bản Thực Hành 4: Xử Lý Hotfix Khẩn Cấp (Hotfix Flow)

### Tình huống:
Phát hiện lỗi chính tả nghiêm trọng hoặc lỗi tính toán trực tiếp trên Production, mã sự cố là **#HOTFIX-201**.

```bash
# 1. Tạo nhánh hotfix ngay từ nhánh prod
git checkout prod
git checkout -b hotfix/fix-hero-typo

# 2. Sửa lỗi trên file và commit chuẩn
git add FE/index.html
git commit -m "fix(hero): correct promotional banner typo #HOTFIX-201"

# 3. Merge vào prod để cập nhật ngay cho người dùng
git checkout prod
git merge hotfix/fix-hero-typo --no-ff -m "Merge hotfix/fix-hero-typo into prod #HOTFIX-201"
git push origin prod

# 4. ĐỒNG BỘ NGƯỢC VÀO STAGING VÀ DEV (Tối quan trọng!)
git checkout staging
git merge prod --no-ff -m "chore(sync): merge prod hotfix into staging #HOTFIX-201"
git push origin staging

git checkout dev
git merge staging --no-ff -m "chore(sync): merge staging hotfix into dev #HOTFIX-201"
git push origin dev

# 5. Xóa nhánh hotfix sau khi hoàn tất
git branch -d hotfix/fix-hero-typo
```
