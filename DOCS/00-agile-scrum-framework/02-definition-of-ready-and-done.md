# 🎯 Tiêu Chuẩn Sẵn Sàng (DoR) & Tiêu Chuẩn Hoàn Thành (DoD)

Một trong những nguyên nhân hàng đầu khiến các dự án phần mềm bị chậm tiến độ, phát sinh nhiều lỗi và gây ức chế cho đội ngũ là sự mơ hồ về yêu cầu và chất lượng. **Scrum Master** thiết lập 2 chốt chặn chất lượng bất khả xâm phạm:

```text
Product Backlog  ──[ Definition of Ready (DoR) ]──>  Sprint Backlog  ──[ Definition of Done (DoD) ]──>  Shippable Product Increment
```

---

## 1. Definition of Ready (DoR) - Tiêu Chuẩn Đưa Vào Sprint

**Definition of Ready** là hợp đồng cam kết giữa **Product Owner (PO)** và **Development Team**. Một User Story chỉ được phép đưa vào Sprint Planning khi và chỉ khi thỏa mãn toàn bộ các điều kiện sau:

### ✅ Checklist DoR (Dành cho Product Owner & Team Refinement):

- [ ] **Định dạng User Story chuẩn**: Viết đúng cú pháp:
  > *"Là một `[vai trò người dùng]`, tôi muốn `[tính năng mong đợi]` để `[giá trị mang lại]`."*
- [ ] **Tiêu chí chấp nhận rõ ràng (Acceptance Criteria - AC)**:
  - Có tối thiểu 3 kịch bản kiểm thử viết theo định dạng **Gherkin (Given - When - Then)**.
  - Bao quát cả kịch bản thành công (Happy Path) và kịch bản lỗi (Edge Cases / Error Handling).
- [ ] **Thiết kế & Giao diện (UI/UX)**:
  - Wireframe hoặc Figma mockup đã được chốt và đính kèm đường dẫn trực tiếp.
  - Đã có đặc tả hành vi tương tác (Loading, Error states, Empty states).
- [ ] **Phụ thuộc kỹ thuật (Technical Dependencies)**:
  - Không bị chặn (Unblocked) bởi các module hoặc API của team khác chưa hoàn thành.
  - Nếu là công nghệ mới, đã hoàn thành bài nghiên cứu thử nghiệm (Spike Task).
- [ ] **Ước lượng độ phức tạp (Estimation)**:
  - Team đã thực hiện ước lượng Planning Poker và Story có kích thước tối đa là **<= 8 Story Points** (Nếu 13 SP, bắt buộc phải phân rã thành các Story nhỏ hơn).
- [ ] **Kế hoạch kiểm thử (Testability)**:
  - Đội ngũ QA xác nhận có thể viết được kịch bản test dựa trên AC đã cung cấp.

---

## 2. Definition of Done (DoD) - Tiêu Chuẩn Hoàn Thành Để Xuất Xưởng

**Definition of Done** là bản tuyên ngôn chất lượng kỹ thuật của **Development Team**. Một User Story chỉ được chuyển sang trạng thái `DONE` khi thỏa mãn 100% các tiêu chí dưới đây:

### ✅ Checklist DoD Cấp Độ Code & Pull Request:
- [ ] Mã nguồn đã được viết sạch (Clean Code), không chứa mã thừa, debug hay `console.log`.
- [ ] Tuân thủ quy chuẩn đặt tên nhánh `feat/GPT-xxx-...` và commit theo chuẩn **Conventional Commits + Issue ID**.
- [ ] **Unit Testing**: Tỷ lệ bao phủ kiểm thử (Test Coverage) cho module mới đạt tối thiểu **>= 80%**.
- [ ] Vượt qua toàn bộ các bước kiểm tra tự động trên CI (Linter, Typecheck, Build, Security Scan).
- [ ] Đã được ít nhất **1 Senior Developer / Tech Lead review và Approve**.

### ✅ Checklist DoD Cấp Độ Môi Trường & Kiểm Thử:
- [ ] Đã merge thành công vào nhánh `dev` và sau đó là `staging`.
- [ ] Đã triển khai (Deployed) thành công lên môi trường **`staging`**.
- [ ] Đội ngũ QA/QC đã kiểm thử độc lập và xác nhận **100% Acceptance Criteria** đều ĐẠT (Pass).
- [ ] Không có lỗi mới phát sinh (No Regression Bugs) trên môi trường Staging.

### ✅ Checklist DoD Cấp Độ Tài Liệu & Vận Hành:
- [ ] Tài liệu API Contracts trong `DOCS/03-thiet-ke-kien-truc-he-thong/02-dac-ta-api-contracts.md` đã được cập nhật nếu có thay đổi endpoints.
- [ ] Đã hoàn thành buổi trình diễn tính năng (Live Demo) tại buổi **Sprint Review** và được Product Owner ký duyệt nghiệm thu (Signed off).
- [ ] Đã tạo Release Notes tóm tắt các thay đổi cho người dùng cuối.

---

## 3. Ma Trận So Sánh Quyền Hạn DoR vs DoD

| Tiêu chí | Definition of Ready (DoR) | Definition of Done (DoD) |
| :--- | :--- | :--- |
| **Thời điểm kích hoạt** | **Trước khi** bắt đầu Sprint (Giai đoạn Refinement) | **Cuối** Sprint (Trước khi đóng Story & Release) |
| **Người chịu trách nhiệm chính** | **Product Owner (PO)** | **Development Team & QA** |
| **Người giám sát tuân thủ** | **Scrum Master** (Từ chối đưa Story chưa Ready vào Sprint) | **Scrum Master** (Từ chối đóng Story chưa Done) |
| **Ý nghĩa với dự án** | Ngăn ngừa lãng phí thời gian và hiểu nhầm nghiệp vụ | Bảo vệ chất lượng sản phẩm và ngăn ngừa nợ kỹ thuật (Tech Debt) |
