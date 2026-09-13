# 🔄 Biểu Mẫu Cải Tiến Sprint (Sprint Retrospective Board Template)

> **Hướng dẫn**: Scrum Master sử dụng biểu mẫu này để điều phối buổi họp Retrospective vào chiều Thứ 6 cuối Sprint. Mục đích là tạo môi trường an toàn tâm lý (Psychological Safety) để đội ngũ thẳng thắn nhìn nhận và cải tiến liên tục.

---

## 📌 Thông Tin Cuộc Họp
- **Sprint**: `[Số Sprint]`
- **Thời gian**: 14:00 - 15:30 Ngày `[DD/MM/YYYY]`
- **Người điều phối (Facilitator)**: Scrum Master
- **Thành viên tham gia**: Toàn bộ Scrum Team (Dev, QA, PO, SM)

---

## 1. Rà Soát Các Hành Động Từ Sprint Trước (Action Items Review)

| Action Item kỳ trước | Người phụ trách | Trạng thái | Đánh giá hiệu quả |
| :--- | :---: | :---: | :--- |
| Thiết lập pre-push hook chặn push prod | Tech Lead | ✅ Hoàn thành | 100% dev tuân thủ quy trình mở PR, không có ai push nhầm |
| Chuẩn bị mock data sớm cho QA | Dev B | 🟡 Đang làm | Mới mock được phần Auth, chưa mock được phần Billing |

---

## 2. Thu Thập Ý Kiến Đóng Góp (Khung: Glad - Sad - Mad)

### 🟢 Điều Khiến Chúng Ta Hài Lòng (GLAD)
- Tinh thần đồng đội hỗ trợ nhau fix lỗi Staging rất nhanh và nhiệt tình.
- Quy chuẩn commit Conventional Commits giúp tra cứu git log cực kỳ trực quan và dễ hiểu.
- Demo cho PO chạy rất mượt, không bị crash giữa chừng.

### 🟡 Điều Làm Chúng Ta Tiếc Nuối Hoặc Lo Lắng (SAD)
- Vẫn có một vài PR mở vào ngày 8 quá muộn, khiến QA bị dồn việc vào Thứ 5.
- Kế hoạch ước lượng Story Point cho phân hệ Stripe Billing bị hụt do tài liệu bên thứ ba thay đổi.

### 🔴 Điều Gây Ức Chế / Chướng Ngại Vật Lớn (MAD)
- Mạng văn phòng bị chập chờn vào chiều Thứ 3 gây đứt kết nối khi push Docker image.
- Yêu cầu ở Story `#GPT-103` bị thay đổi giữa chừng nhưng PO không thông báo sớm trên ticket.

---

## 3. Kế Hoạch Hành Động Cụ Thể Cho Sprint Tới (Action Items)
> [!IMPORTANT]
> **Quy tắc vàng của Scrum Master**: Chỉ chọn tối đa **2 đến 3 hành động cụ thể, khả thi và đo lường được (SMART)**, tránh đặt ra quá nhiều mục tiêu để rồi không ai làm.

| Thứ tự | Hành động cải tiến (Action Item) | Người phụ trách (Owner) | Tiêu chí hoàn thành (Done Criteria) |
| :---: | :--- | :---: | :--- |
| **#1** | Áp dụng triệt để quy tắc **Code Freeze 17:00 Ngày 8**, kiên quyết không merge tính năng mới sau giờ này | Scrum Master & Tech Lead | 100% PR tính năng được merge trước hạn chót. |
| **#2** | Tổ chức phiên Spike Research 1 ngày trước khi bắt đầu Sprint đối với các dịch vụ bên ngoài chưa rõ | Dev A (Backend Lead) | Có tài liệu POC trước buổi Planning. |
| **#3** | PO cập nhật thay đổi yêu cầu trực tiếp vào Acceptance Criteria trên GitHub Issue ngay khi có phát sinh | Product Owner | Không có hiểu nhầm về logic nghiệp vụ. |
