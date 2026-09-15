#!/usr/bin/env python3
"""
Script kiểm tra trực tiếp Nhà Cung Cấp (Upstream AI Provider) và Gateway
Không cần Postman - Chạy trực tiếp 1 dòng lệnh trên Terminal
"""

import urllib.request
import urllib.error
import json
import time
import base64
import os
import sys

UPSTREAM_URL = "https://api.leeh.dev"
UPSTREAM_KEY = "sk-5BZ6LD4DPV5BW75GFNVL4BBOMOHKXDOK37LLQROO7NNVXXSXQ55A===="
GATEWAY_URL = "https://api-gpt-images.nexoratech.com.vn/api/v1"

def print_separator(title=""):
    print("\n" + "=" * 60)
    if title:
        print(f"  {title}")
        print("=" * 60)

def test_text_to_image():
    print_separator("TEST 1: TẠO ẢNH TỪ CHỮ (TEXT-TO-IMAGE)")
    prompt = "A cute little kitten playing with a ball in a sunlit living room, 8k cinematic photorealistic"
    print(f"Prompt: '{prompt}'")
    print("Model: gpt-image-2 | Res: 1k | Quality: medium")
    print("Đang gửi yêu cầu tới Nhà Cung Cấp...")

    payload = {
        "prompt": prompt,
        "model": "gpt-image-2",
        "modelKey": "gpt-image-2",
        "mode": "generation",
        "aspectRatio": "1024x1024",
        "resolution": "1k",
        "quality": "medium",
        "count": 1
    }

    url = f"{UPSTREAM_URL}/v1/images/generations"
    headers = {
        "Authorization": f"Bearer {UPSTREAM_KEY}",
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0"
    }

    t0 = time.time()
    req = urllib.request.Request(url, data=json.dumps(payload).encode("utf-8"), headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=180) as resp:
            elapsed = time.time() - t0
            data = json.loads(resp.read().decode("utf-8"))
            print(f"✅ THÀNH CÔNG! HTTP {resp.status} trong {elapsed:.2f} giây")
            
            img_data = None
            if "images" in data and len(data["images"]) > 0:
                first = data["images"][0]
                img_data = first.get("url") if isinstance(first, dict) else first
            elif "generation" in data:
                img_data = data["generation"].get("outputDataUrl") or data["generation"].get("output")
            
            if img_data and img_data.startswith("data:image/"):
                out_file = "test_result_text.png"
                b64 = img_data.split(",", 1)[1]
                with open(out_file, "wb") as f:
                    f.write(base64.b64decode(b64))
                print(f"🖼️ Đã lưu ảnh kết quả vào file: {out_file}")
                os.system(f"open {out_file} 2>/dev/null")
            elif img_data:
                print(f"🔗 URL ảnh: {img_data}")
    except urllib.error.HTTPError as e:
        print(f"❌ LỖI HTTP {e.code}: {e.read().decode('utf-8')[:300]}")
    except Exception as e:
        print(f"❌ LỖI: {e}")

def test_image_to_image():
    print_separator("TEST 2: TẠO ẢNH CÓ ẢNH MẪU (IMAGE-TO-IMAGE)")
    prompt_vi = "Thêm con mèo nằm kế bên không thay đổi khung cảnh"
    prompt_en = "A cute cat lying next to the puppy on the rug, identical room and lighting, maintaining the original scene"
    ref_url = "https://api-gpt-images.nexoratech.com.vn/static/uploads/references/opt_puppy_1024.jpg"
    
    print(f"Prompt (Tiếng Việt): '{prompt_vi}'")
    print(f"Prompt tối ưu (Tiếng Anh): '{prompt_en}'")
    print(f"Ảnh mẫu: {ref_url}")
    # Tải ảnh mẫu và chuyển đổi sang Base64 Data URI
    try:
        req_ref = urllib.request.Request(ref_url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req_ref, timeout=15) as r_resp:
            ref_b64 = base64.b64encode(r_resp.read()).decode("utf-8")
            ref_data_uri = f"data:image/jpeg;base64,{ref_b64}"
    except Exception as e:
        print(f"Lưu ý: Không tải được ảnh trực tiếp ({e}), sử dụng ảnh placeholder test")
        ref_data_uri = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII="

    payload = {
        "prompt": prompt_vi,
        "model": "gpt-image-2",
        "modelKey": "gpt-image-2",
        "mode": "edit",
        "sourceImages": [ref_data_uri],
        "executionMode": "sync",
        "aspectRatio": "1024x1024",
        "count": 1
    }

    url = f"{UPSTREAM_URL}/v1/images/generations"
    headers = {
        "Authorization": f"Bearer {UPSTREAM_KEY}",
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0"
    }

    t0 = time.time()
    req = urllib.request.Request(url, data=json.dumps(payload).encode("utf-8"), headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=180) as resp:
            elapsed = time.time() - t0
            data = json.loads(resp.read().decode("utf-8"))
            print(f"✅ THÀNH CÔNG! HTTP {resp.status} trong {elapsed:.2f} giây")
            
            img_data = None
            if "images" in data and len(data["images"]) > 0:
                first = data["images"][0]
                img_data = first.get("url") if isinstance(first, dict) else first
            elif "generation" in data:
                img_data = data["generation"].get("outputDataUrl") or data["generation"].get("output")
            
            if img_data and img_data.startswith("data:image/"):
                out_file = "test_result_i2i.png"
                b64 = img_data.split(",", 1)[1]
                with open(out_file, "wb") as f:
                    f.write(base64.b64decode(b64))
                print(f"🖼️ Đã lưu ảnh kết quả vào file: {out_file}")
                os.system(f"open {out_file} 2>/dev/null")
            elif img_data:
                print(f"🔗 URL ảnh: {img_data}")
    except urllib.error.HTTPError as e:
        print(f"❌ LỖI HTTP {e.code}: {e.read().decode('utf-8')[:300]}")
    except Exception as e:
        print(f"❌ LỖI: {e}")

def test_models():
    print_separator("TEST 3: KIỂM TRA MODEL NHÀ CUNG CẤP (/v1/models)")
    url = f"{UPSTREAM_URL}/v1/models"
    headers = {
        "Authorization": f"Bearer {UPSTREAM_KEY}",
        "User-Agent": "Mozilla/5.0"
    }
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            models = [m.get("id") for m in data.get("data", [])]
            print(f"✅ Kết nối NCC tốt! Có {len(models)} models đang hoạt động:")
            for m in models:
                print(f"  • {m}")
    except Exception as e:
        print(f"❌ Lỗi kết nối: {e}")

def main():
    print_separator("CÔNG CỤ KIỂM TRA NHÀ CUNG CẤP (AI PROVIDER TESTER)")
    print("1. Kiểm tra danh sách Model NCC (/v1/models)")
    print("2. Test tạo ảnh Text-to-Image (Chữ -> Ảnh)")
    print("3. Test tạo ảnh Image-to-Image (Ảnh mẫu -> Ảnh biến thể)")
    print("4. Chạy toàn bộ (1, 2, 3)")
    print("0. Thoát")
    
    choice = input("\nChọn bài test [1-4] (mặc định: 1): ").strip() or "1"
    
    if choice == "1":
        test_models()
    elif choice == "2":
        test_text_to_image()
    elif choice == "3":
        test_image_to_image()
    elif choice == "4":
        test_models()
        test_text_to_image()
        test_image_to_image()
    else:
        print("Tạm biệt!")

if __name__ == "__main__":
    main()
