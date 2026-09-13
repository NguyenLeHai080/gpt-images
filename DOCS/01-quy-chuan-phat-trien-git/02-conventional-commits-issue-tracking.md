# 🏷️ Quy Chuẩn Commit Git & Quản Lý Issue ID (Conventional Commits)

Một commit message rõ ràng, chuẩn chỉnh không chỉ là văn bản hiển thị thông tin đơn thuần mà còn là chìa khóa để:
- Giúp đồng đội và reviewer hiểu ngay mục đích đoạn code trong 3 giây.
- Cho phép tra cứu lại lịch sử sau 6 tháng - 1 năm mà không phải đoán mò.
- Tự động hóa việc tạo Release Notes / Changelog và versioning tự động.
- Liên kết chặt chẽ mọi thay đổi mã nguồn với công việc trong Jira/GitHub Issues.

---

## 1. Nguyên Tắc Cốt Lõi

1. **Trước khi viết hãy nghĩ đến người đọc**: Hãy đặt mình vào vị trí người review hoặc người bảo trì hệ thống sau này.
2. **Độ dài tiêu đề (Subject line)**: Tối đa **50 ký tự** (không vượt quá 72 ký tự). Nếu cần giải thích chi tiết, hãy xuống dòng viết trong phần `body`.
3. **Không dùng dấu chấm (`.`) ở cuối dòng tiêu đề**: Tiêu đề mang tính chất tóm tắt ngắn gọn.
4. **Bắt buộc đi kèm Issue ID**: Mọi commit phải chứa mã định danh công việc (ví dụ: `#GPT-101`, `#123`).
5. **Tính nhất quán về ngôn ngữ**: Sử dụng thống nhất một ngôn ngữ (Tiếng Việt hoặc Tiếng Anh chuẩn), không pha trộn từ ngữ hỗn tạp trừ các thuật ngữ chuyên ngành kỹ thuật.

---

## 2. Cấu Trúc Commit Message Chuẩn

```text
<type>[optional scope]: <description> #<issue_id>

[optional body]

[optional footer]
```

### Chi tiết từng thành phần:

| Thành phần | Trạng thái | Giải thích |
| :--- | :--- | :--- |
| **`type`** | **Bắt buộc** | Từ khóa phân loại mục đích chính của commit (xem danh sách bên dưới). |
| **`scope`** | *Tùy chọn* (Khuyên dùng) | Chỉ rõ module/thành phần bị ảnh hưởng (ví dụ: `auth`, `generator`, `gallery`, `billing`). |
| **`description`** | **Bắt buộc** | Mô tả súc tích hành động thực hiện, bắt đầu bằng động từ thể mệnh lệnh hoặc ngắn gọn. |
| **`issue_id`** | **Bắt buộc** | Mã định danh của Issue hoặc Task (ví dụ: `#GPT-101`, `#HOTFIX-201`). |
| **`body`** | *Tùy chọn* | Đoạn văn chi tiết giải thích **lý do thay đổi (Why)** và **bối cảnh (Context)**. |
| **`footer`** | *Tùy chọn* | Ghi chú Breaking Changes, tham chiếu PR, hoặc đóng Issue: `Closes #101`. |

---

## 3. Bảng Phân Loại Type (Commit Types)

| Type | Ý nghĩa | Khi nào sử dụng? |
| :--- | :--- | :--- |
| **`feat`** | Feature | Thêm một tính năng hoặc chức năng mới cho người dùng. |
| **`fix`** | Bug Fix | Sửa chữa lỗi kỹ thuật hoặc sự cố trong mã nguồn. |
| **`refactor`** | Refactoring | Cải tiến, làm sạch cấu trúc code mà không sửa bug cũng không thêm tính năng mới. |
| **`docs`** | Documentation | Thêm mới, cập nhật hoặc sửa chữa tài liệu hướng dẫn. |
| **`chore`** | Maintenance | Những thay đổi phụ trợ không liên quan đến logic code (cấu hình build, npm scripts, gitignore,...). |
| **`style`** | Code Style / UI | Thay đổi giao diện CSS, căn lề, format code mà không làm thay đổi logic hoạt động. |
| **`perf`** | Performance | Cải tiến mã nguồn giúp tối ưu hóa hiệu năng và tốc độ xử lý. |
| **`vendor`** | Dependencies | Nâng cấp hoặc cập nhật phiên bản của thư viện, dependencies, Docker image. |
| **`test`** | Unit / Integration Test | Bổ sung bài kiểm thử hoặc sửa đổi test suite. |

---

## 4. Ví Dụ Cụ Thể (Chuẩn vs Kém Chuẩn)

### ✅ Ví dụ Đạt chuẩn (Best Practice):

- **Thêm mới tính năng:**
  ```text
  feat(landing): add modern homepage interface #GPT-101
  ```
- **Sửa lỗi tính năng đăng nhập:**
  ```text
  fix(auth): resolve invalid jwt token handling #GPT-105
  ```
- **Tái cấu trúc mã nguồn:**
  ```text
  refactor(generator): optimize prompt parsing logic #GPT-112
  ```
- **Cập nhật dependency:**
  ```text
  vendor(deps): upgrade openai sdk to version 4.28 #GPT-120
  ```
- **Commit đầy đủ cả Body và Footer:**
  ```text
  feat(billing): integrate stripe checkout payment flow #GPT-130

  - Add webhook handler for invoice.payment_succeeded
  - Update user credit balance upon successful payment
  - Send email notification confirmation

  Closes #GPT-130
  ```

---

### ❌ Ví dụ "Rởm" (Cần tránh tuyệt đối):

| Commit Message tồi | Lý do bị từ chối | Cách sửa chuẩn |
| :--- | :--- | :--- |
| `update code` | Không có type, không có scope, không có issue ID, không rõ làm gì. | `refactor(auth): clean up token verification service #GPT-105` |
| `fix bug.` | Có dấu chấm cuối câu, không rõ sửa bug gì, thiếu issue ID. | `fix(auth): fix password validation regex #GPT-105` |
| `feat: Sửa lỗi đăng xuất` | **Sửa lỗi** nhưng lại dùng type `feat`! Rất dễ gây nhầm lẫn. | `fix(logout): clear session token on user signout #GPT-108` |
| `hihi` hoặc `aaaaa` | Commit vô nghĩa, làm rác lịch sử git repository. | Viết đúng nội dung thực tế vừa sửa. |
| `feat(home): Thêm nút đăng nhập và đổi màu nền và sửa luôn bug thanh toán` | Commit làm quá nhiều việc không liên quan. | Tách làm 3 commit riêng biệt tương ứng từng mục tiêu. |
