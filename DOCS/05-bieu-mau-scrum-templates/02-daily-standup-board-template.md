# ⏱️ Biểu Mẫu Theo Dõi Daily Standup (Daily Standup Log Template)

> **Hướng dẫn**: Scrum Master sử dụng mẫu này để ghi nhanh các cập nhật quan trọng và danh sách chướng ngại vật (Blockers) trong 15 phút họp đứng mỗi sáng lúc 9:00.

---

## 📅 Nhật Ký Standup Ngày: `[DD/MM/YYYY]` - Sprint: `[Số Sprint]`

- **Thời gian**: 09:00 - 09:15 AM
- **Thành viên vắng mặt (nếu có)**: `[Tên thành viên & Lý do]`
- **Trạng thái Burndown Chart**: `[Đúng tiến độ / Trễ 1 ngày / Vượt tiến độ]`

---

## 🗣️ Cập Nhật Nhanh Từng Thành Viên

### 1. Thành viên: `[Tên Dev A]`
- **Hôm qua**: Đã hoàn thành API sinh ảnh POST `/api/v1/images/generate`, mở PR #14.
- **Hôm nay**: Review PR #15 của Dev B, bắt đầu làm task upload ảnh S3.
- **Blocker**: Không có.

### 2. Thành viên: `[Tên Dev B]`
- **Hôm qua**: Đã tích hợp xong giao diện prompt box trên Frontend.
- **Hôm nay**: Kết nối API từ Frontend tới Backend.
- **Blocker**: ⚠️ Gặp lỗi CORS khi gọi API dev từ localhost.

### 3. Thành viên: `[Tên QA Lead]`
- **Hôm qua**: Viết xong bộ Test Cases cho phân hệ Billing.
- **Hôm nay**: Chuẩn bị dữ liệu kiểm thử trên môi trường Staging.
- **Blocker**: Không có.

---

## 🚨 Bảng Theo Dõi Chướng Ngại Vật (Active Blockers Table)

| ID | Mô tả sự cố | Ảnh hưởng tới Story | Người phát hiện | Người hỗ trợ (Owner) | Target Giờ xử lý xong | Trạng thái |
| :---: | :--- | :---: | :---: | :---: | :---: | :---: |
| `B-01` | Lỗi CORS giữa FE và BE cục bộ | `#GPT-101` | Dev B | Tech Lead | 11:00 AM | 🟡 Đang xử lý |
| `B-02` | Chưa nhận được API Key Cloudflare R2 | `#GPT-102` | Dev A | Scrum Master | 14:00 PM | 🟢 Đã giải quyết |

---

## 🎯 Chỉ Số Tự Tin Hoàn Thành Sprint Goal (Confidence Vote: 1 - 5 Sao)
- **Điểm tự tin trung bình của Team hôm nay**: `4.5 / 5 ⭐`
