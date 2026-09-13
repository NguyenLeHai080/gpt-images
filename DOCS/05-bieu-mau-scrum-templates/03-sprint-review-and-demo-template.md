# 🎬 Biểu Mẫu Sprint Review & Demo (Sprint Review Script & Report)

> **Hướng dẫn**: Sử dụng biểu mẫu này để điều phối buổi trình diễn sản phẩm (Live Demo) trên môi trường **`staging`** vào sáng Thứ 6 cuối Sprint.

---

## 📌 Thông Tin Buổi Review
- **Sprint**: `[Số Sprint]`
- **Thời gian**: 09:30 - 11:00 AM Ngày `[DD/MM/YYYY]`
- **Môi trường Demo**: `https://staging.gptimages.app` *(Tuyệt đối không demo trên Localhost)*
- **Người chủ trì (Facilitator)**: Scrum Master
- **Người tham dự**: Product Owner, Development Team, QA Team, Đại diện Stakeholders / Khách hàng

---

## 🎯 Nhắc Lại Mục Tiêu Sprint (Sprint Goal)
- **Cam kết ban đầu**: `[Nội dung Sprint Goal]`
- **Mức độ đạt được**: `[Đạt 100% / Đạt 85% / Không đạt]`

---

## 📽️ Kịch Bản Trình Diễn Live Demo (Demo Flow)

| Thứ tự | Tính năng Demo | User Story liên quan | Người thực hiện Demo | Kết quả nghiệm thu (PO Decision) |
| :---: | :--- | :---: | :---: | :---: |
| **1** | Đăng ký tài khoản mới & nhận 20 Credits | `#GPT-104` | Dev D | ✅ **Accepted** |
| **2** | Nhập prompt "Thành phố tương lai" & Sinh ảnh | `#GPT-101` | Dev B | ✅ **Accepted** |
| **3** | Mở thư viện cá nhân & Tải ảnh về máy | `#GPT-102` | Dev C | ✅ **Accepted** |
| **4** | Nạp 500 Credits qua thẻ tín dụng | `#GPT-103` | Dev A | ⚠️ **Feedback điều chỉnh** *(Xem bên dưới)* |

---

## 💬 Ý Kiến Đóng Góp & Phản Hồi Từ Stakeholders (Feedback Log)

1. **Feedback 1 (Về giao diện thanh toán)**:
   - *Người góp ý*: Stakeholder / PO
   - *Nội dung*: Cần hiển thị rõ hơn tỷ giá quy đổi USD sang VND ở bước xác nhận thanh toán.
   - *Hành động*: Tạo User Story mới `#GPT-135` đưa vào Product Backlog cho Sprint tới.
2. **Feedback 2 (Về tốc độ tạo ảnh)**:
   - *Nội dung*: Cần thêm thanh loading phần trăm trực quan khi AI đang render ảnh.
   - *Hành động*: Tạo Improvement Task `#GPT-136`.

---

## 📊 Tổng Kết Số Điểm Vận Tốc (Sprint Velocity Result)
- **Tổng số Story Points cam kết**: `35 SP`
- **Tổng số Story Points được PO nghiệm thu (Accepted)**: `32 SP`
- **Tổng số Story Points bị từ chối / chuyển sang Sprint sau**: `3 SP`
- **Tình trạng phát hành (Release Status)**: ✅ **Đủ điều kiện xuất xưởng Release vX.Y.0 lên Production**
