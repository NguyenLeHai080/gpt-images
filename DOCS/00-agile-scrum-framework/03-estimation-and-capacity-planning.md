# 📊 Quy Trình Ước Lượng (Estimation) & Hoạch Định Năng Lực (Capacity Planning)

Ước lượng trong Agile Scrum không nhằm mục đích đoán trước chính xác số giờ làm việc, mà để đo lường **độ phức tạp tương đối, khối lượng công việc và rủi ro tiềm ẩn** của từng User Story.

---

## 1. Thang Đo Điểm Độ Phức Tạp (Story Points - Dãy Fibonacci)

Dự án sử dụng thang đo Fibonacci biến thể: **`1, 2, 3, 5, 8, 13`**.

| Điểm (SP) | Mức độ phức tạp | Đặc điểm nhận diện | Ví dụ thực tế trong dự án GPT-Images |
| :---: | :--- | :--- | :--- |
| **1 SP** | Rất nhỏ (Trivial) | Thay đổi giao diện tĩnh, sửa text, thêm icon, đổi biến config. Rủi ro = 0. | Đổi tiêu đề banner, sửa màu nút Tạo ảnh |
| **2 SP** | Nhỏ (Small) | Thêm một form input đơn giản, validate dữ liệu cơ bản, viết thêm 1 API GET đơn giản. | API lấy danh sách tags gợi ý Prompt |
| **3 SP** | Trung bình (Medium) | Logic nghiệp vụ quen thuộc, cần tương tác giữa FE và BE, có xử lý lỗi và viết Unit Test. | Tích hợp trang Gallery cá nhân, phân trang ảnh |
| **5 SP** | Lớn (Large) | Tính năng cốt lõi, có logic phức tạp, gọi dịch vụ bên thứ ba hoặc lưu trữ đám mây. | Tích hợp gọi AI API sinh ảnh và upload lên S3 |
| **8 SP** | Rất lớn (Complex) | Độ phức tạp cao nhất cho phép trong 1 Sprint. Đòi hỏi kiến trúc mới, bảo mật hoặc giao dịch tài chính. | Tích hợp cổng thanh toán Stripe & Trừ credit nguyên tử |
| **>= 13 SP** | **Quá lớn (Epic)** | ❌ **BỊ TỪ CHỐI BỞI SCRUM MASTER**. Story quá lớn, nguy cơ vỡ Sprint rất cao. | Bắt buộc phải phân rã (Decompose) thành các Story 3 SP và 5 SP. |

---

## 2. Kỹ Thuật Ước Lượng Planning Poker

Trong buổi **Backlog Refinement** hoặc **Sprint Planning**:
1. PO đọc nội dung User Story và giải thích rõ Acceptance Criteria.
2. Cả team trao đổi làm rõ thắc mắc về mặt kỹ thuật trong tối đa 3-5 phút.
3. Tất cả các thành viên Dev/QA cùng chọn thẻ điểm Story Point bí mật cùng lúc (không được trao đổi điểm trước để tránh hiệu ứng mỏ neo - Anchoring Bias).
4. Đồng loạt mở thẻ:
   - Nếu điểm số đồng thuận: Ghi nhận điểm số cho Story.
   - Nếu có sự chênh lệch lớn (ví dụ: người chọn 2 SP, người chọn 8 SP):
     - Người cho điểm thấp nhất giải thích: *"Tôi thấy việc này đơn giản vì..."*
     - Người cho điểm cao nhất giải thích: *"Tôi thấy tiềm ẩn rủi ro ở chỗ..."*
   - Cả team biểu quyết lại lần 2 để chốt điểm số thống nhất.

---

## 3. Hoạch Định Năng Lực (Capacity Planning) & Vận Tốc (Velocity)

### 3.1. Công thức tính Năng lực Sprint (Sprint Capacity)
```text
Team Capacity (Giờ thực tế) = [Tổng số thành viên Dev/QA] x [Số ngày làm việc trong Sprint] x [Hệ số tập trung Focus Factor]
```
- *Hệ số tập trung (Focus Factor)* thường lấy từ **0.65 đến 0.75** (đã trừ thời gian họp hành, hỗ trợ sự cố, code review, nghỉ phép).

### 3.2. Đo lường Vận tốc (Velocity)
- **Velocity** là tổng số Story Points mà đội ngũ đã **hoàn thành 100% đạt chuẩn DoD** trong một Sprint.
- *Nguyên tắc thép của Scrum*: Nếu một Story 5 SP đã xong code 90% nhưng chưa hoàn thành QA testing tại ngày cuối cùng của Sprint -> **Được tính là 0 SP** cho Sprint đó (Không có khái niệm hoàn thành 4.5 SP).
- Lấy giá trị trung bình của 3 Sprint gần nhất làm cơ sở cam kết cho Sprint tiếp theo.

---

## 4. Kiểm Soát Khối Lượng Đang Làm (WIP Limit) & Biểu Đồ Burndown

- **Quy tắc WIP (Work In Progress)**: Tại bất kỳ thời điểm nào, số lượng task ở cột `In Progress` không được vượt quá **`[Số Dev] x 1.5`**.
- **Burndown Chart**:
  - Đường lý tưởng (Ideal Line) giảm đều đặn từ ngày 1 đến ngày 10.
  - Nếu đường thực tế (Actual Line) nằm ngang quá 3 ngày liên tiếp: Scrum Master lập tức can thiệp trong Daily Standup để phát hiện nguyên nhân tắc nghẽn (Bottlenecks) và tái phân bổ nguồn lực.
