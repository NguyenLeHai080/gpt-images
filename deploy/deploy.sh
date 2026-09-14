#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "=== [GPT-IMAGES DEPLOYMENT] Bắt đầu triển khai Production ==="
cd "$PROJECT_ROOT"

echo "1. Cập nhật mã nguồn từ nhánh prod..."
git fetch origin prod
git reset --hard origin/prod

ENV_FILE="$PROJECT_ROOT/.env"
if [ ! -f "$ENV_FILE" ]; then
    echo "Tạo file .env mặc định cho production..."
    cat <<EOF > "$ENV_FILE"
POSTGRES_DB=gpt_images
POSTGRES_USER=gpt_images
POSTGRES_PASSWORD=gpt_images_secure_2026
SECRET_KEY=gpt-images-secret-key-prod-2026-secure
VITE_API_BASE_URL=https://api-gpt-images.nexoratech.com.vn/api/v1
EOF
fi

echo "2. Build và khởi động lại Docker containers..."
docker compose -f deploy/compose.prod.yml up -d --build --remove-orphans

echo "3. Dọn dẹp images cũ (không còn dùng)..."
docker image prune -f --filter "until=72h" || true

echo "=== [GPT-IMAGES DEPLOYMENT] Hoàn tất triển khai thành công! ==="
echo "Frontend: http://127.0.0.1:86 (Domain: gpt-images.nexoratech.com.vn)"
echo "Backend:  http://127.0.0.1:87 (Domain: api-gpt-images.nexoratech.com.vn)"
