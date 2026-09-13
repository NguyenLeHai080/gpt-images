# ⏱️ Chu Kỳ Sprint & Bản Đồ Ánh Xạ Gitflow (Sprint Cadence & Gitflow Mapping)

Dưới góc nhìn của **Scrum Master**, Gitflow không chỉ là một công cụ quản lý phiên bản mã nguồn, mà chính là **hệ thống đường ray vận chuyển giá trị (Value Stream Delivery Pipeline)** của đội ngũ phát triển trong suốt chu kỳ Sprint.

Dự án áp dụng chu kỳ **Sprint 2 tuần (10 ngày làm việc)** tiêu chuẩn.

---

## 1. Bản Đồ Tương Tác Giữa Các Sự Kiện Scrum & Các Nhánh Gitflow

```mermaid
gantt
    title Sprint 2 Tuần (10 Ngày Làm Việc) & Trạng Thái Nhánh Gitflow
    dateFormat  YYYY-MM-DD
    axisFormat  Day %d

    section Scrum Ceremonies
    Sprint Planning (Day 1)          :milestone, m1, 2026-09-01, 0d
    Daily Standup (Mỗi sáng 9:00)     :active, c1, 2026-09-01, 10d
    Code Freeze Mềm (Day 8 17:00)    :milestone, m2, 2026-09-08, 0d
    Sprint Demo / Review (Day 10)    :milestone, m3, 2026-09-10, 0d
    Sprint Retrospective (Day 10)    :milestone, m4, 2026-09-10, 0d
    Prod Release (Day 10 cuối ngày)  :milestone, m5, 2026-09-10, 0d

    section Hoạt Động Trên Git
    Nhánh feat/* từ dev              :active, g1, 2026-09-01, 8d
    Merge feat/* vào dev qua PR      :active, g2, 2026-09-02, 7d
    Merge dev -> staging (QA Test)   :crit, g3, 2026-09-08, 2d
    Fix bug staging & Demo trên Staging: g4, 2026-09-09, 2d
    Merge staging -> prod (vX.Y.0)   :crit, g5, 2026-09-10, 1d
    Reverse Sync prod -> dev         :g6, 2026-09-10, 1d
```

---

## 2. Nhật Ký Chi Tiết 10 Ngày Trong Sprint (Sprint Day-by-Day Playbook)

### Tuần 1: Khởi Động & Tăng Tốc Phát Triển

#### 📅 Ngày 1 (Thứ Hai): Sprint Planning & Khởi Tạo Nhánh
- **Nghiệp vụ Scrum**:
  - PO trình bày Product Backlog đã đạt chuẩn **Definition of Ready (DoR)**.
  - Team thống nhất **Sprint Goal** (Mục tiêu tối thượng của Sprint).
  - Phân rã User Story thành các Technical Tasks, cam kết khối lượng công việc dựa trên **Velocity**.
- **Thao tác Git**:
  - Lập trình viên đồng bộ nhánh `dev`: `git checkout dev && git pull origin dev`.
  - Tạo nhánh tính năng theo mã User Story: `git checkout -b feat/GPT-101-image-prompt`.

#### 📅 Ngày 2 – Ngày 5 (Thứ Ba – Thứ Sáu): Continuous Integration & Early Code Review
- **Nghiệp vụ Scrum**:
  - Daily Standup lúc 9:00 sáng (15 phút tối đa).
  - Scrum Master theo dõi **Burndown Chart**, chủ động phát hiện các Story bị "ngâm" quá 2 ngày ở cột `In Progress`.
  - Áp dụng nguyên tắc **WIP Limit (Work In Progress <= 2 tasks/developer)** để tránh làm dàn trải.
- **Thao tác Git**:
  - Lập trình viên commit thường xuyên với Conventional Commits + Issue ID.
  - Khi hoàn thành tính năng, mở Pull Request vào `dev`.
  - Peer review diễn ra liên tục. Sau khi pass CI và có 1-2 approvals -> Merge vào `dev`.

---

### Tuần 2: Ổn Định, Kiểm Thử Chấp Nhận & Xuất Bản

#### 📅 Ngày 6 – Ngày 7 (Thứ Hai – Thứ Ba): Hoàn Thiện Các Tính Năng Cuối
- **Nghiệp vụ Scrum**:
  - SM rà soát các User Story còn lại. Nếu có nguy cơ vỡ Sprint Goal, SM tổ chức trao đổi ngay với PO để điều chỉnh phạm vi (Scope Adjustment).
- **Thao tác Git**:
  - Nhanh chóng merge các PR tính năng cuối cùng vào nhánh `dev`.

#### 📅 Ngày 8 (Thứ Tư): CODE FREEZE MỀM & Chuyển Giao Cho QA Trên `staging`
- **Nghiệp vụ Scrum**:
  - **17:00 chiều Ngày 8**: Đóng băng tính năng mới (Code Freeze).
  - Tất cả các Story chưa kịp merge vào `dev` sẽ được dời sang Sprint sau (Không merge vội vàng để tránh phá vỡ bản build).
- **Thao tác Git**:
  - Tech Lead merge `dev` vào `staging`:
    ```bash
    git checkout staging
    git pull origin staging
    git merge dev --no-ff -m "chore(release): code freeze sprint-12 into staging for QA #SPRINT-12"
    git push origin staging
    ```
  - Pipeline CI/CD tự động deploy bản build lên môi trường `https://staging.gptimages.app`.

#### 📅 Ngày 9 (Thứ Năm): QA Testing & Fix Lỗi Staging
- **Nghiệp vụ Scrum**:
  - Đội ngũ QA tiến hành kiểm thử toàn diện (Regression Test & Acceptance Criteria Verification).
  - Nếu phát hiện bug, tạo nhanh task `bugfix` và ưu tiên giải quyết ngay trong ngày.
- **Thao tác Git**:
  - Lập trình viên fix bug và đẩy trực tiếp vào nhánh `staging` để QA re-test.

#### 📅 Ngày 10 (Thứ Sáu): Sprint Review, Retrospective & Release Production
- **09:30 Sáng - Sprint Review / Demo**:
  - Trình diễn trực tiếp các User Story đã hoàn thành (đạt chuẩn **Definition of Done**) trên môi trường **`staging`** cho PO và Stakeholders.
  - Thu nhận feedback từ khách hàng/stakeholders.
- **14:00 Chiều - Sprint Retrospective**:
  - Toàn đội ngũ họp đúc rút kinh nghiệm (What went well, What didn't go well, Action items cải tiến cho Sprint tới).
- **16:30 Chiều - Production Release**:
  - Sau khi PO nghiệm thu sản phẩm đạt chuẩn, Tech Lead mở PR merge `staging` vào `prod`:
    ```bash
    git checkout prod
    git merge staging --no-ff -m "chore(release): release sprint-12 v1.2.0 to production #RELEASE-SPRINT-12"
    git tag -a v1.2.0 -m "Release Increment Sprint 12"
    git push origin prod --tags
    ```
  - Thực hiện **Reverse Sync** từ `prod` ngược lại vào `dev` để đảm bảo nhánh phát triển luôn đồng bộ mã nguồn mới nhất:
    ```bash
    git checkout dev
    git merge prod --no-ff -m "chore(sync): post-release sync sprint-12 into dev #SYNC-PROD"
    git push origin dev
    ```
