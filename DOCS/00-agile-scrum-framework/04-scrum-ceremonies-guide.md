# 🎪 Hướng Dẫn Vận Hành 4 Lễ Hội Scrum (Scrum Ceremonies Playbook)

Các buổi lễ hội (Ceremonies) trong Scrum không phải là những cuộc họp báo cáo đơn thuần, mà là các phiên làm việc có giới hạn thời gian nghiêm ngặt (**Timeboxed**) nhằm thanh tra (Inspection) và thích nghi (Adaptation) liên tục.

---

## 1. Bảng Tổng Hợp 4 Lễ Hội Scrum Cốt Lõi

| Lễ hội | Thời điểm diễn ra | Giới hạn thời gian (Timebox) | Thành phần tham dự | Mục tiêu chính |
| :--- | :--- | :--- | :--- | :--- |
| **Sprint Planning** | Đầu Sprint (Sáng Thứ 2 tuần 1) | **2 - 4 Giờ** | PO, SM, Dev Team, QA | Thống nhất Sprint Goal & cam kết Sprint Backlog |
| **Daily Scrum** | Mỗi buổi sáng (9:00 - 9:15) | **15 Phút** | Dev Team, QA, SM (PO tùy chọn) | Đồng bộ tiến độ 24h & phát hiện Blockers |
| **Sprint Review / Demo** | Cuối Sprint (Sáng Thứ 6 tuần 2) | **1 - 2 Giờ** | PO, SM, Team, Stakeholders | Demo sản phẩm thực tế trên Staging & nhận feedback |
| **Sprint Retrospective** | Cuối Sprint (Chiều Thứ 6 tuần 2) | **1 - 1.5 Giờ** | SM, Dev Team, QA, PO | Cải tiến quy trình làm việc, tìm giải pháp cho Sprint sau |

---

## 2. Chi Tiết Từng Lễ Hội

### 2.1. Sprint Planning (Lập Kế Hoạch Sprint)
- **Phần 1 - What (Làm cái gì?)**:
  - PO trình bày mục tiêu kinh doanh và các User Story có độ ưu tiên cao nhất đã đạt chuẩn **Definition of Ready (DoR)**.
  - Team cùng PO thống nhất một câu tóm tắt **Sprint Goal**. Ví dụ: *"Hoàn thiện luồng tạo ảnh từ prompt và tích hợp thư viện lưu trữ cá nhân"*.
- **Phần 2 - How (Làm như thế nào?)**:
  - Dev Team và QA phân rã từng User Story thành các nhiệm vụ kỹ thuật cụ thể (Frontend task, Backend task, Database task, Test case task).
  - Ước lượng giờ và đối chiếu với **Capacity** thực tế.

---

### 2.2. Daily Scrum (Họp Đứng Hàng Ngày)
- **Nguyên tắc vàng**:
  - Đúng giờ (9:00 sáng), tất cả đứng họp (đứng giúp mọi người nói ngắn gọn, không lan man).
  - Không giải quyết vấn đề kỹ thuật chuyên sâu tại cuộc họp (Nếu cần thảo luận sâu, tạo cuộc hẹn 1-1 riêng ngay sau Standup).
- **Mỗi thành viên trả lời ngắn gọn 3 câu hỏi**:
  1. *Hôm qua tôi đã làm được gì để giúp đội ngũ tiến gần hơn tới Sprint Goal?*
  2. *Hôm nay tôi sẽ làm gì để giúp đội ngũ hoàn thành Sprint Goal?*
  3. *Tôi có đang gặp chướng ngại vật (Blocker / Impediment) nào cản trở công việc không?*

---

### 2.3. Sprint Review & Demo (Đánh Giá & Trình Diễn Sản Phẩm)
- **Quy định nghiêm ngặt**:
  - **Chỉ Demo trên môi trường `staging`** (Không dùng slide thuyết trình hoặc mock video, không demo code chạy cục bộ trên máy cá nhân).
  - Trình diễn theo đúng các User Story đã hoàn thành đạt chuẩn **Definition of Done (DoD)**.
- **Kịch bản thực hiện**:
  1. Scrum Master nhắc lại Sprint Goal ban đầu.
  2. Các thành viên luân phiên trình diễn trực tiếp tính năng.
  3. PO xác nhận chấp thuận (Accept) hoặc từ chối (Reject) từng Story.
  4. Lắng nghe phản hồi từ khách hàng và ghi nhận các ý tưởng mới vào Product Backlog.

---

### 2.4. Sprint Retrospective (Cải Tiến Quy Trình)
- **Tâm thế tham dự (Prime Directive)**:
  > *"Bất kể chúng ta phát hiện điều gì, chúng ta đều hiểu và thực sự tin rằng mọi người đã làm tốt nhất có thể trong hoàn cảnh, kỹ năng và nguồn lực sẵn có tại thời điểm đó."*
- **Khung làm việc mẫu (Framework)**:
  - **What went well? (Điều gì đã làm tốt?)**: Chia sẻ lời khen ngợi, thực hành kỹ thuật tốt.
  - **What didn't go well? (Điều gì chưa tốt / gây ức chế?)**: Code review chậm, thiếu tài liệu API, vỡ estimate.
  - **Action Items (Hành động cụ thể)**: Chọn tối đa **2 - 3 hành động cụ thể**, chỉ định rõ Người chịu trách nhiệm (Assignee) và Hạn hoàn thành trong Sprint tiếp theo.
