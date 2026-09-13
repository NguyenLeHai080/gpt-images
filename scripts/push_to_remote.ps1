# ==============================================================================
# Script Tự Động Đẩy Hệ Thống Nhánh & Tags Lên GitHub (Scrum & Gitflow Initial Push)
# ==============================================================================

# Cập nhật PATH để nhận diện Git từ môi trường hệ thống
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host "🚀 TIẾN HÀNH ĐẨY HỆ THỐNG NHÁNH VÀ TAGS LÊN REMOTE GITHUB" -ForegroundColor Yellow
Write-Host "   Repository: https://github.com/NguyenLeHai080/gpt-images" -ForegroundColor Gray
Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Đẩy nhánh tích hợp dev
Write-Host "👉 Bước 1: Đẩy nhánh trung tâm 'dev'..." -ForegroundColor Cyan
git push -u origin dev
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Đẩy nhánh dev thất bại. Vui lòng kiểm tra quyền đăng nhập GitHub." -ForegroundColor Red
    exit 1
}

# 2. Đẩy nhánh kiểm thử staging (sử dụng --no-verify cho lần khởi tạo đầu tiên lên remote)
Write-Host "👉 Bước 2: Khởi tạo nhánh 'staging' trên remote..." -ForegroundColor Cyan
git push --no-verify -u origin staging

# 3. Đẩy nhánh production prod
Write-Host "👉 Bước 3: Khởi tạo nhánh 'prod' trên remote..." -ForegroundColor Cyan
git push --no-verify -u origin prod

# 4. Đẩy toàn bộ Release Tags
Write-Host "👉 Bước 4: Đẩy toàn bộ Release Tags (v1.0.0, v1.0.1)..." -ForegroundColor Cyan
git push --tags origin

Write-Host ""
Write-Host "================================================================================" -ForegroundColor Green
Write-Host "✅ ĐÃ HOÀN TẤT ĐẨY TOÀN BỘ CẤU TRÚC GITFLOW LÊN GITHUB THÀNH CÔNG!" -ForegroundColor Green
Write-Host "👉 Xem kết quả tại: https://github.com/NguyenLeHai080/gpt-images/branches" -ForegroundColor Yellow
Write-Host "================================================================================" -ForegroundColor Green
