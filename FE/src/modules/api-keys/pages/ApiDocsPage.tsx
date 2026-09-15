import React, { useState, useEffect } from 'react';
import {
  Terminal,
  KeyRound,
  Sparkles,
  Zap,
  Check,
  Copy,
  ExternalLink,
  BookOpen,
  Code2,
  AlertTriangle,
  Layers,
  ShieldCheck,
  Globe,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../../../core/components/Button/Button';
import { alert } from '../../../core/alert';

interface TocItem {
  id: string;
  title: string;
  badge?: string;
  badgeColor?: string;
}

const TOC_ITEMS: TocItem[] = [
  { id: 'overview', title: '1. Tổng quan & Base URL', badge: 'REST / OpenAI', badgeColor: 'text-brand-600 font-bold' },
  { id: 'quickstart', title: '2. Khởi đầu nhanh (Quickstart)', badge: '3 Bước', badgeColor: 'text-emerald-600 font-bold' },
  { id: 'authentication', title: '3. Xác thực Bearer Token', badge: 'Header', badgeColor: 'font-mono text-slate-400' },
  { id: 'models-specs', title: '4. Mô hình AI & Điểm ảnh thực', badge: '4 Models', badgeColor: 'text-purple-600 font-bold' },
  { id: 'parameters', title: '5. Endpoint & Bảng tham số', badge: 'POST', badgeColor: 'bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-mono font-bold' },
  { id: 'code-samples', title: '6. Mẫu Code Đa Ngôn Ngữ', badge: 'cURL / Python / Node / PHP', badgeColor: 'text-brand-600 font-bold' },
  { id: 'smart-cache', title: '7. Smart Cache & Quyết toán', badge: '150đ / ảnh', badgeColor: 'text-amber-600 font-bold' },
  { id: 'errors', title: '8. Mã Lỗi & HTTP Status', badge: 'HTTP', badgeColor: 'text-rose-600 font-mono font-bold' },
];

export const ApiDocsPage: React.FC = () => {
  const [activeLang, setActiveLang] = useState<'curl' | 'python' | 'nodejs' | 'php'>('curl');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<string>('overview');

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 120;
      for (let i = TOC_ITEMS.length - 1; i >= 0; i--) {
        const item = TOC_ITEMS[i];
        const el = document.getElementById(item.id);
        if (el) {
          const top = el.offsetTop;
          if (scrollPosition >= top) {
            setActiveSection(item.id);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      const headerOffset = 84;
      const elementPosition = el.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
      setActiveSection(id);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    alert.toast('Đã sao chép vào bộ nhớ tạm!', 'success', { timer: 2000 });
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (
    window.location.origin.includes('nexoratech.com.vn')
      ? 'https://api-gpt-images.nexoratech.com.vn/api/v1'
      : (window.location.origin.includes('517')
          ? 'http://127.0.0.1:8001/api/v1'
          : `${window.location.origin}/api/v1`)
  );

  const CODE_EXAMPLES = {
    curl: `# ==========================================================
# 1. Tạo ảnh từ văn bản (Text-to-Image) - Model 2.5 Flare (Khuyên dùng)
# ==========================================================
curl -X POST "${API_BASE_URL}/images/generations" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "prompt": "Một chú mèo phi hành gia trong không gian neon, chi tiết điện ảnh 8K",
    "model": "gpt-image-2.5-flare",
    "aspect_ratio": "1024x1024",
    "resolution": "2k",
    "quality": "high"
  }'

# ==========================================================
# 2. Chỉnh sửa theo ảnh mẫu (Image-to-Image / Edits)
# Tự động chuyển mode Edit - Miễn phí 100% ảnh tham chiếu
# ==========================================================
curl -X POST "${API_BASE_URL}/images/generations" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "prompt": "Thay đổi màu áo sang màu xanh neon phát sáng, thêm kính râm thời trang",
    "model": "gpt-image-2.5-flare",
    "reference": "https://domain.com/photo.jpg",
    "aspect_ratio": "1024x1024",
    "resolution": "2k",
    "quality": "high"
  }'`,

    python: `# Cách 1: Sử dụng thư viện requests
import requests

url = "${API_BASE_URL}/images/generations"
headers = {
    "Authorization": "Bearer YOUR_API_KEY",
    "Content-Type": "application/json"
}

payload = {
    "prompt": "Một chú mèo phi hành gia trong không gian neon, chi tiết điện ảnh 8K",
    "model": "gpt-image-2.5-flare",  # 'gpt-image-2.5-flare' | 'gpt-image-2.5-sunburst' | 'gpt-image-2' | 'gemini-3.1-flash-image-preview'
    "aspect_ratio": "1024x1024",      # '1024x1024' (1:1) | '1792x1024' (16:9) | '1024x1792' (9:16)
    "resolution": "2k",               # '1k' | '2k' | '4k' (Độ phân giải điểm ảnh pixel)
    "quality": "high",                # 'low' | 'medium' | 'high' (Chất lượng render & độ chi tiết)
    # "reference": "https://domain.com/photo.jpg",  # Tùy chọn: Chỉnh sửa ảnh có sẵn
    "force_refresh": False
}

response = requests.post(url, json=payload, headers=headers)
data = response.json()

if data.get("success"):
    print("Link ảnh tạo xong:", data["data"]["image_url"])
    print("Chi phí:", data["data"]["charged_amount"], "đ (Chỉ trừ khi thành công)")
else:
    print("Lỗi:", data.get("message"))

# ----------------------------------------------------------
# Cách 2: Tương thích 100% với thư viện OpenAI SDK chính thức!
# ----------------------------------------------------------
# from openai import OpenAI
# client = OpenAI(
#     base_url="${API_BASE_URL}",
#     api_key="YOUR_API_KEY"
# )
# img = client.images.generate(
#     model="gpt-image-2.5-flare",
#     prompt="Một chú mèo phi hành gia 8K",
#     size="1024x1024"
# )
# print(img.data[0].url)`,

    nodejs: `// Cách 1: Sử dụng Fetch API chuẩn (Node.js 18+)
async function generateImage() {
  const response = await fetch('${API_BASE_URL}/images/generations', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer YOUR_API_KEY',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt: 'Một chú mèo phi hành gia trong không gian neon, chi tiết điện ảnh 8K',
      model: 'gpt-image-2.5-flare',
      aspect_ratio: '1024x1024',
      resolution: '2k', // '1k' | '2k' | '4k'
      quality: 'high',  // 'low' | 'medium' | 'high'
      // reference: 'https://domain.com/sample.jpg', // Bỏ ghi chú nếu muốn sửa ảnh có sẵn
    }),
  });

  const data = await response.json();
  if (data.success) {
    console.log('URL ảnh tạo xong:', data.data.image_url);
    console.log('Thời gian xử lý:', data.data.latency_ms, 'ms');
  } else {
    console.error('Lỗi gọi API:', data.message);
  }
}

generateImage();

// ----------------------------------------------------------
// Cách 2: Tương thích hoàn toàn với thư viện official 'openai'
// ----------------------------------------------------------
// import OpenAI from 'openai';
// const openai = new OpenAI({
//   baseURL: '${API_BASE_URL}',
//   apiKey: 'YOUR_API_KEY',
// });
// const result = await openai.images.generate({
//   model: 'gpt-image-2.5-flare',
//   prompt: 'Chú mèo phi hành gia 8K',
//   size: '1024x1024',
// });
// console.log(result.data[0].url);`,

    php: `<?php
// PHP cURL Request
$ch = curl_init();

$payload = [
    "prompt" => "Một chú mèo phi hành gia trong không gian neon, chi tiết điện ảnh 8K",
    "model" => "gpt-image-2.5-flare", // 'gpt-image-2.5-flare' | 'gpt-image-2.5-sunburst' | 'gpt-image-2' | 'gemini-3.1-flash-image-preview'
    "aspect_ratio" => "1024x1024",     // '1024x1024' (1:1) | '1792x1024' (16:9) | '1024x1792' (9:16)
    "resolution" => "2k",             // '1k' | '2k' | '4k'
    "quality" => "high",              // 'low' | 'medium' | 'high'
    // "reference" => "https://domain.com/photo.jpg", // Tùy chọn sửa ảnh có sẵn
    "force_refresh" => false
];

curl_setopt_array($ch, [
    CURLOPT_URL => "${API_BASE_URL}/images/generations",
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => json_encode($payload),
    CURLOPT_HTTPHEADER => [
        "Authorization: Bearer YOUR_API_KEY",
        "Content-Type: application/json"
    ],
]);

$response = curl_exec($ch);
curl_close($ch);

$result = json_decode($response, true);
if ($result && $result['success']) {
    echo "Ảnh hoàn tất: " . $result['data']['image_url'];
    echo "Chi phí: " . $result['data']['charged_amount'] . " đ";
} else {
    echo "Lỗi: " . ($result['message'] ?? 'Không xác định');
}
?>`,
  };

  const SAMPLE_RESPONSE = `{
  "success": true,
  "message": "Tạo hình ảnh thành công",
  "data": {
    "job_id": "job_54c50aaec15749b9",
    "status": "SUCCEEDED",
    "prompt": "Một chú mèo phi hành gia trong không gian neon, chi tiết điện ảnh 8K",
    "model": "gpt-image-2.5-flare",
    "aspect_ratio": "1024x1024",
    "resolution": "2k",
    "quality": "high",
    "image_url": "${API_BASE_URL}/generations/jobs/job_54c50aaec15749b9/image",
    "charged_amount": 150.0,
    "currency": "VND",
    "is_cached": false,
    "latency_ms": 320,
    "created_at": "2026-09-15T06:45:00"
  }
}`;

  return (
    <div className="animate-fade-in flex flex-col gap-8 pb-16">
      {/* Top Banner Header */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-brand-950 p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-brand-500 text-white shadow-sm whitespace-nowrap">
                API Docs v2.5
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-white/10 text-slate-300 border border-white/10 whitespace-nowrap">
                REST & OpenAI SDK Native
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 whitespace-nowrap">
                <Zap size={12} /> Đồng giá 150 đ / ảnh
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Tài Liệu Cổng API Tạo Ảnh AI
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed font-normal">
              Cổng API hiệu năng cao tương thích chuẩn Native OpenAI API, hỗ trợ các mô hình{' '}
              <strong className="text-brand-400 font-bold">gpt-image-2.5-flare</strong>,{' '}
              <strong className="text-brand-400 font-bold">gpt-image-2.5-sunburst</strong>,{' '}
              <strong className="text-brand-400 font-bold">gpt-image-2</strong> và{' '}
              <strong className="text-brand-400 font-bold">nanobanana-2</strong>. Điểm ảnh thực, chỉ trừ tiền khi tạo thành công.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 whitespace-nowrap">
            <Link to="/app/api-keys">
              <Button
                variant="primary"
                size="md"
                className="bg-brand-500 hover:bg-brand-600 text-white font-bold shadow-md shadow-brand-500/30 whitespace-nowrap"
                leftIcon={<KeyRound size={15} />}
              >
                Lấy API Key Ngay
              </Button>
            </Link>
            <Link to="/app/studio">
              <Button
                variant="outline"
                size="md"
                className="border-white/20 text-white hover:bg-white/10 whitespace-nowrap"
                rightIcon={<ExternalLink size={14} />}
              >
                Thử Tại Studio
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Grid: Sidebar Table of Contents + Documentation Body */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Sticky Navigation Menu */}
        <aside className="lg:col-span-3 sticky top-20 z-20 self-start max-h-[calc(100vh-6rem)] overflow-y-auto bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-4 custom-scrollbar-light">
          <div className="text-xs font-extrabold text-slate-400 uppercase tracking-wider px-2 flex items-center gap-1.5 whitespace-nowrap">
            <BookOpen size={14} className="text-brand-500" />
            <span>Mục Lục Hướng Dẫn</span>
          </div>

          <nav className="space-y-1 text-xs font-semibold text-slate-600">
            {TOC_ITEMS.map((item) => {
              const isActive = activeSection === item.id;
              return (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  onClick={(e) => scrollToSection(e, item.id)}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-brand-50 text-brand-700 font-bold border-l-3 border-brand-500 pl-2.5 shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border-l-3 border-transparent'
                  }`}
                >
                  <span className="truncate">{item.title}</span>
                  {item.badge && (
                    <span className={`text-[10px] shrink-0 ml-1.5 whitespace-nowrap ${item.badgeColor || 'text-slate-400'}`}>
                      {item.badge}
                    </span>
                  )}
                </a>
              );
            })}
          </nav>

          <div className="pt-3 border-t border-slate-100">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 space-y-2">
              <span className="text-[11px] font-bold text-slate-700 block whitespace-nowrap">Bạn chưa có API Key?</span>
              <p className="text-[10px] text-slate-500 leading-normal">
                Tạo khóa bí mật miễn phí để bắt đầu kết nối ứng dụng của bạn ngay hôm nay.
              </p>
              <Link to="/app/api-keys" className="block">
                <Button variant="primary" size="sm" className="w-full text-xs whitespace-nowrap">
                  + Quản lý API Keys
                </Button>
              </Link>
            </div>
          </div>
        </aside>

        {/* Right Content Area (Tài liệu chi tiết) */}
        <main className="lg:col-span-9 space-y-10">
          {/* Section 1: Overview */}
          <section id="overview" className="scroll-mt-24 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <Globe size={20} className="text-brand-500" />
              <h2 className="text-lg font-bold text-slate-900 whitespace-nowrap">1. Tổng Quan & Base URL</h2>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Tất cả các yêu cầu API được thực thi qua giao thức HTTPS bảo mật, định dạng dữ liệu truyền nhận bằng{' '}
              <code className="bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded font-mono text-[11px]">JSON</code>.
              Hệ thống tương thích hoàn toàn với chuẩn <strong>OpenAI Image API</strong> (<code>/v1/images/generations</code> và <code>/v1/images/edits</code>).
            </p>

            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-700 whitespace-nowrap">Root Endpoint Base URL:</span>
              <div className="flex items-center justify-between bg-slate-900 text-emerald-400 p-3.5 rounded-xl font-mono text-xs shadow-inner whitespace-nowrap">
                <span className="select-all">{API_BASE_URL}</span>
                <button
                  type="button"
                  onClick={() => handleCopy(API_BASE_URL, 'base-url')}
                  className="text-slate-400 hover:text-white p-1 transition-colors ml-2"
                  title="Sao chép Base URL"
                >
                  {copiedKey === 'base-url' ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                </button>
              </div>
            </div>
          </section>

          {/* Section 2: Quickstart */}
          <section id="quickstart" className="scroll-mt-24 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <Sparkles size={20} className="text-brand-500" />
              <h2 className="text-lg font-bold text-slate-900 whitespace-nowrap">2. Khởi Đầu Nhanh Trong 3 Bước</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                <span className="w-6 h-6 rounded-full bg-brand-500 text-white flex items-center justify-center text-xs font-bold">
                  1
                </span>
                <h3 className="font-bold text-slate-800 text-xs mt-2 whitespace-nowrap">Lấy API Key</h3>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Truy cập trang <Link to="/app/api-keys" className="text-brand-600 font-semibold underline">Quản lý API Keys</Link> để tạo khóa bí mật dạng <code>mf_live_sec_...</code>
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                <span className="w-6 h-6 rounded-full bg-brand-500 text-white flex items-center justify-center text-xs font-bold">
                  2
                </span>
                <h3 className="font-bold text-slate-800 text-xs mt-2 whitespace-nowrap">Gửi Yêu Cầu Tạo Ảnh</h3>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Gửi request <code>POST /images/generations</code> với prompt mô tả và khổ ảnh mong muốn.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                <span className="w-6 h-6 rounded-full bg-brand-500 text-white flex items-center justify-center text-xs font-bold">
                  3
                </span>
                <h3 className="font-bold text-slate-800 text-xs mt-2 whitespace-nowrap">Nhận Ảnh Trực Tiếp</h3>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Hệ thống trả về trực tiếp <code>image_url</code> điểm ảnh thực. Chỉ trừ tiền 150đ khi ảnh render thành công.
                </p>
              </div>
            </div>
          </section>

          {/* Section 3: Authentication */}
          <section id="authentication" className="scroll-mt-24 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <ShieldCheck size={20} className="text-brand-500" />
              <h2 className="text-lg font-bold text-slate-900 whitespace-nowrap">3. Xác Thực (Authentication)</h2>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Mọi request gửi tới Cổng API bắt buộc phải kèm theo Header xác thực HTTP Bearer Token:
            </p>

            <div className="bg-slate-900 text-slate-200 p-4 rounded-xl font-mono text-xs shadow-inner space-y-1">
              <span className="text-slate-500"># Header bắt buộc:</span>
              <div className="text-emerald-400 font-bold whitespace-nowrap select-all">
                Authorization: Bearer YOUR_API_KEY
              </div>
              <div className="text-slate-300 whitespace-nowrap">Content-Type: application/json</div>
            </div>

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-start gap-2.5 text-xs text-amber-800">
              <AlertTriangle size={16} className="shrink-0 mt-0.5 text-amber-600" />
              <span>
                <strong>Bảo mật:</strong> Không lưu API Key trên mã nguồn frontend client-side công khai. Hãy luôn gọi API thông qua backend server của bạn!
              </span>
            </div>
          </section>

          {/* Section 4: Models & Specs */}
          <section id="models-specs" className="scroll-mt-24 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <Layers size={20} className="text-brand-500" />
              <h2 className="text-lg font-bold text-slate-900 whitespace-nowrap">4. Danh Sách Mô Hình AI & Tỷ Lệ Điểm Ảnh</h2>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Cổng API hỗ trợ 4 mô hình tạo ảnh thế hệ mới cùng các kích thước chuẩn điểm ảnh thực (Native Pixel Output):
            </p>

            {/* 4 Models Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="border border-brand-200 rounded-xl p-3.5 bg-brand-50/40 space-y-1">
                <div className="flex items-center justify-between whitespace-nowrap">
                  <span className="font-mono font-bold text-xs text-brand-700">gpt-image-2.5-flare</span>
                  <span className="text-[10px] bg-brand-100 text-brand-800 font-bold px-1.5 py-0.5 rounded">Mặc định / Khuyên dùng</span>
                </div>
                <p className="text-xs font-semibold text-slate-800">Siêu sắc nét, chân thực, ánh sáng HDR</p>
                <p className="text-[11px] text-slate-500">Tối ưu cho ảnh thực tế, sản phẩm thương mại, chân dung chi tiết cao.</p>
              </div>

              <div className="border border-purple-200 rounded-xl p-3.5 bg-purple-50/40 space-y-1">
                <div className="flex items-center justify-between whitespace-nowrap">
                  <span className="font-mono font-bold text-xs text-purple-700">gpt-image-2.5-sunburst</span>
                  <span className="text-[10px] bg-purple-100 text-purple-800 font-bold px-1.5 py-0.5 rounded">Điện ảnh</span>
                </div>
                <p className="text-xs font-semibold text-slate-800">Màu sắc rực rỡ, nghệ thuật sống động</p>
                <p className="text-[11px] text-slate-500">Phù hợp ảnh phong cách anime, poster phim, phong cảnh huyền ảo.</p>
              </div>

              <div className="border border-blue-200 rounded-xl p-3.5 bg-blue-50/40 space-y-1">
                <div className="flex items-center justify-between whitespace-nowrap">
                  <span className="font-mono font-bold text-xs text-blue-700">gpt-image-2</span>
                  <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-1.5 py-0.5 rounded">Tiêu chuẩn</span>
                </div>
                <p className="text-xs font-semibold text-slate-800">Ổn định, cân bằng bố cục</p>
                <p className="text-[11px] text-slate-500">Thích hợp cho đa dạng tác vụ đồ họa và hình minh họa chung.</p>
              </div>

              <div className="border border-emerald-200 rounded-xl p-3.5 bg-emerald-50/40 space-y-1">
                <div className="flex items-center justify-between whitespace-nowrap">
                  <span className="font-mono font-bold text-xs text-emerald-700">nanobanana-2</span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">Siêu tốc</span>
                </div>
                <p className="text-xs font-semibold text-slate-800">Tốc độ render nhanh nhất</p>
                <p className="text-[11px] text-slate-500">Thời gian tạo cực nhanh, tối ưu cho ứng dụng tương tác thời gian thực.</p>
              </div>
            </div>

            {/* Bảng Kích thước Native Pixels */}
            <div className="space-y-2 pt-2">
              <span className="text-xs font-bold text-slate-800 block whitespace-nowrap">
                Kích thước điểm ảnh thực (Native Output):
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                <div className="p-2.5 rounded-lg border border-slate-200 bg-white">
                  <span className="font-mono font-bold text-slate-900 block whitespace-nowrap">1024x1024 (1:1)</span>
                  <span className="text-[10px] text-slate-500 block">Vuông — Avatar, Mạng xã hội</span>
                </div>
                <div className="p-2.5 rounded-lg border border-slate-200 bg-white">
                  <span className="font-mono font-bold text-slate-900 block whitespace-nowrap">1792x1024 (16:9)</span>
                  <span className="text-[10px] text-slate-500 block">Ngang — Máy tính, Youtube, Banner</span>
                </div>
                <div className="p-2.5 rounded-lg border border-slate-200 bg-white">
                  <span className="font-mono font-bold text-slate-900 block whitespace-nowrap">1024x1792 (9:16)</span>
                  <span className="text-[10px] text-slate-500 block">Dọc — TikTok, Reels, Story, Phone</span>
                </div>
                <div className="p-2.5 rounded-lg border border-slate-200 bg-white">
                  <span className="font-mono font-bold text-slate-900 block whitespace-nowrap">1024x768 (4:3)</span>
                  <span className="text-[10px] text-slate-500 block">Ngang chuẩn — Trình chiếu</span>
                </div>
                <div className="p-2.5 rounded-lg border border-slate-200 bg-white">
                  <span className="font-mono font-bold text-slate-900 block whitespace-nowrap">768x1024 (3:4)</span>
                  <span className="text-[10px] text-slate-500 block">Dọc chân dung — Poster</span>
                </div>
                <div className="p-2.5 rounded-lg border border-slate-200 bg-white">
                  <span className="font-mono font-bold text-slate-900 block whitespace-nowrap">2048x2048 (2K HD)</span>
                  <span className="text-[10px] text-slate-500 block">Vuông 2K — Độ nét cao in ấn</span>
                </div>
              </div>
            </div>
          </section>

          {/* Section 5: Endpoint & Parameters */}
          <section id="parameters" className="scroll-mt-24 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-wrap gap-2">
              <div className="flex items-center gap-2.5">
                <Terminal size={20} className="text-brand-500" />
                <h2 className="text-lg font-bold text-slate-900 whitespace-nowrap">5. Endpoint & Bảng Tham Số</h2>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-mono font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded whitespace-nowrap">
                  POST /api/v1/images/generations
                </span>
                <span className="text-xs font-mono font-bold bg-purple-100 text-purple-800 px-2 py-0.5 rounded whitespace-nowrap">
                  POST /api/v1/images/edits
                </span>
              </div>
            </div>

            <div className="p-3 bg-brand-50/80 rounded-xl border border-brand-200 text-xs text-brand-900 flex items-start gap-2">
              <Sparkles size={16} className="text-brand-600 shrink-0 mt-0.5" />
              <div>
                <strong>Tự động kích hoạt chế độ Sửa ảnh (Image-to-Image / Edit):</strong> Khi truyền tham số <code>reference</code> hoặc <code>references</code>, API sẽ tự động chuyển sang pipeline chỉnh sửa ảnh của NCC. <strong>Miễn phí 100% chi phí ảnh tham chiếu</strong> (vẫn đồng giá 150đ/ảnh thành công).
              </div>
            </div>

            {/* Callout Box: Phân biệt Quality vs Resolution */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-purple-900/10 via-brand-900/10 to-sky-900/10 border border-purple-200/80 mb-4 space-y-2">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <span className="text-base">💡</span>
                <span>Phân Biệt Thông Số: Resolution (Độ Phân Giải) vs Quality (Chất Lượng Render)</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="bg-white p-3 rounded-lg border border-sky-200 shadow-2xs">
                  <div className="flex items-center justify-between font-bold text-sky-800 mb-1">
                    <span>1. resolution (1k, 2k, 4k)</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-100 text-sky-700 font-mono">Pixel Dimensions</span>
                  </div>
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    Quy định kích thước điểm ảnh thực tế xuất ra:
                    <br />• <code>"1k"</code>: ~1024 × 1024 px (Mặc định, tốc độ sinh ảnh nhanh nhất)
                    <br />• <code>"2k"</code>: ~2048 × 2048 px (Độ nét cao Crisp HD, khuyên dùng)
                    <br />• <code>"4k"</code>: ~4096 × 4096 px (Siêu phân giải Ultra HD cho in ấn & khổ lớn)
                  </p>
                </div>
                <div className="bg-white p-3 rounded-lg border border-purple-200 shadow-2xs">
                  <div className="flex items-center justify-between font-bold text-purple-800 mb-1">
                    <span>2. quality (low, medium, high)</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 font-mono">Denoising Steps</span>
                  </div>
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    Quy định số bước lấy mẫu khử nhiễu & chi tiết texture:
                    <br />• <code>"low"</code>: Phác thảo nhanh, ít bước render, siêu tốc tiết kiệm
                    <br />• <code>"medium"</code>: Tiêu chuẩn cân bằng chi tiết chuẩn Studio (Mặc định)
                    <br />• <code>"high"</code>: Tối đa bước render, ánh sáng HDR và độ sắc nét chi tiết sâu
                  </p>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 text-[11px] uppercase bg-slate-50/60 whitespace-nowrap">
                    <th className="p-3 font-bold whitespace-nowrap">Tham số</th>
                    <th className="p-3 font-bold whitespace-nowrap">Kiểu</th>
                    <th className="p-3 font-bold whitespace-nowrap">Mặc định</th>
                    <th className="p-3 font-bold whitespace-nowrap">Bắt buộc</th>
                    <th className="p-3 font-bold">Mô tả</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  <tr>
                    <td className="p-3 font-mono font-bold text-brand-600 whitespace-nowrap">prompt</td>
                    <td className="p-3 font-mono text-slate-500 whitespace-nowrap">string</td>
                    <td className="p-3 font-mono text-slate-400 whitespace-nowrap">-</td>
                    <td className="p-3 whitespace-nowrap"><span className="text-rose-600 font-bold">Có</span></td>
                    <td className="p-3">Mô tả hình ảnh cần tạo hoặc chi tiết cần chỉnh sửa trên ảnh mẫu (hỗ trợ Tiếng Việt & Tiếng Anh).</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-mono font-bold text-slate-800 whitespace-nowrap">model</td>
                    <td className="p-3 font-mono text-slate-500 whitespace-nowrap">string</td>
                    <td className="p-3 font-mono text-slate-500 whitespace-nowrap">"gpt-image-2.5-flare"</td>
                    <td className="p-3 text-slate-400 whitespace-nowrap">Không</td>
                    <td className="p-3">Mô hình AI: <code>"gpt-image-2.5-flare"</code>, <code>"gpt-image-2.5-sunburst"</code>, <code>"gpt-image-2"</code>, <code>"gemini-3.1-flash-image-preview"</code>.</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-mono font-bold text-slate-800 whitespace-nowrap">resolution</td>
                    <td className="p-3 font-mono text-slate-500 whitespace-nowrap">string</td>
                    <td className="p-3 font-mono text-slate-500 whitespace-nowrap">"1k"</td>
                    <td className="p-3 text-slate-400 whitespace-nowrap">Không</td>
                    <td className="p-3">Độ phân giải điểm ảnh pixel: <code>"1k"</code> (~1024px), <code>"2k"</code> (~2048px), <code>"4k"</code> (~4096px).</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-mono font-bold text-slate-800 whitespace-nowrap">quality</td>
                    <td className="p-3 font-mono text-slate-500 whitespace-nowrap">string</td>
                    <td className="p-3 font-mono text-slate-500 whitespace-nowrap">"medium"</td>
                    <td className="p-3 text-slate-400 whitespace-nowrap">Không</td>
                    <td className="p-3">Chất lượng lấy mẫu render: <code>"low"</code> (phác thảo siêu tốc), <code>"medium"</code> (chuẩn Studio), <code>"high"</code> (siêu chi tiết HDR).</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-mono font-bold text-slate-800 whitespace-nowrap">aspect_ratio</td>
                    <td className="p-3 font-mono text-slate-500 whitespace-nowrap">string</td>
                    <td className="p-3 font-mono text-slate-500 whitespace-nowrap">"1024x1024"</td>
                    <td className="p-3 text-slate-400 whitespace-nowrap">Không</td>
                    <td className="p-3">Tỷ lệ khung hình hoặc kích thước pixel: <code>"1:1"</code>, <code>"16:9"</code>, <code>"9:16"</code>, <code>"4:3"</code>, <code>"3:4"</code>, <code>"3:2"</code>, <code>"2:3"</code> hoặc pixel <code>"1024x1024"</code>, <code>"2048x2048"</code>.</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-mono font-bold text-slate-800 whitespace-nowrap">size</td>
                    <td className="p-3 font-mono text-slate-500 whitespace-nowrap">string</td>
                    <td className="p-3 font-mono text-slate-500 whitespace-nowrap">"1024x1024"</td>
                    <td className="p-3 text-slate-400 whitespace-nowrap">Không</td>
                    <td className="p-3">Kích thước pixel theo chuẩn OpenAI (alias của <code>aspect_ratio</code>): ví dụ <code>"1024x1024"</code>, <code>"1792x1024"</code>, <code>"1024x1792"</code>, <code>"2048x2048"</code>.</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-mono font-bold text-slate-800 whitespace-nowrap">reference</td>
                    <td className="p-3 font-mono text-slate-500 whitespace-nowrap">string</td>
                    <td className="p-3 font-mono text-slate-400 whitespace-nowrap">null</td>
                    <td className="p-3 text-slate-400 whitespace-nowrap">Không</td>
                    <td className="p-3">Đường dẫn URL hoặc Base64 ảnh gốc khi cần sửa ảnh hoặc tham chiếu phong cách.</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-mono font-bold text-slate-800 whitespace-nowrap">references</td>
                    <td className="p-3 font-mono text-slate-500 whitespace-nowrap">array[string]</td>
                    <td className="p-3 font-mono text-slate-400 whitespace-nowrap">null</td>
                    <td className="p-3 text-slate-400 whitespace-nowrap">Không</td>
                    <td className="p-3">Danh sách ảnh nguồn khi tham chiếu từ nhiều hình ảnh.</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-mono font-bold text-slate-800 whitespace-nowrap">force_refresh</td>
                    <td className="p-3 font-mono text-slate-500 whitespace-nowrap">boolean</td>
                    <td className="p-3 font-mono text-slate-500 whitespace-nowrap">false</td>
                    <td className="p-3 text-slate-400 whitespace-nowrap">Không</td>
                    <td className="p-3">Đặt <code>true</code> để bỏ qua Smart Cache và yêu cầu AI sinh một biến thể mới hoàn toàn.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Section 6: Code Samples */}
          <section id="code-samples" className="scroll-mt-24 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <Code2 size={20} className="text-brand-500" />
                <h2 className="text-lg font-bold text-slate-900 whitespace-nowrap">6. Mẫu Code Gọi API Đa Ngôn Ngữ</h2>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
                {(['curl', 'python', 'nodejs', 'php'] as const).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setActiveLang(lang)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                      activeLang === lang
                        ? 'bg-white text-brand-600 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {lang === 'nodejs' ? 'Node.js' : lang.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative rounded-xl overflow-hidden bg-slate-900 shadow-inner group">
              <div className="flex items-center justify-between px-4 py-2.5 bg-slate-950/80 border-b border-slate-800 text-xs text-slate-400 whitespace-nowrap">
                <span className="font-mono">{activeLang === 'nodejs' ? 'index.js' : activeLang === 'python' ? 'app.py' : activeLang === 'php' ? 'index.php' : 'Terminal / Bash'}</span>
                <button
                  type="button"
                  onClick={() => handleCopy(CODE_EXAMPLES[activeLang], `snippet-${activeLang}`)}
                  className="flex items-center gap-1 text-slate-300 hover:text-white transition-colors bg-white/10 px-2.5 py-1 rounded-md text-[11px] whitespace-nowrap"
                >
                  {copiedKey === `snippet-${activeLang}` ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                  <span>{copiedKey === `snippet-${activeLang}` ? 'Đã sao chép' : 'Sao chép code'}</span>
                </button>
              </div>
              <pre className="p-4 text-xs font-mono text-slate-200 overflow-x-auto leading-relaxed custom-scrollbar-light">
                <code>{CODE_EXAMPLES[activeLang]}</code>
              </pre>
            </div>

            {/* Phản hồi JSON mẫu */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between whitespace-nowrap">
                <span className="text-xs font-bold text-slate-800">Cấu trúc dữ liệu phản hồi (Response 200 OK):</span>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  HTTP 200 OK
                </span>
              </div>
              <pre className="p-4 rounded-xl bg-slate-900 text-emerald-400 font-mono text-xs overflow-x-auto leading-relaxed shadow-inner">
                <code>{SAMPLE_RESPONSE}</code>
              </pre>
            </div>
          </section>

          {/* Section 7: Smart Cache & Policy */}
          <section id="smart-cache" className="scroll-mt-24 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <Zap size={20} className="text-amber-500" />
              <h2 className="text-lg font-bold text-slate-900 whitespace-nowrap">7. Smart Cache 25ms & Chính Sách Quyết Toán</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200 space-y-1">
                <span className="font-bold text-emerald-900 flex items-center gap-1.5 whitespace-nowrap">
                  <ShieldCheck size={15} className="text-emerald-600" /> Thành công mới tính tiền
                </span>
                <p className="text-emerald-800 text-[11px] leading-relaxed">
                  Nếu NCC trả lỗi 5xx, timeout hoặc lỗi render, tài khoản được <strong>hoàn 100% tiền</strong> ngay lập tức.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-purple-50/60 border border-purple-200 space-y-1">
                <span className="font-bold text-purple-900 flex items-center gap-1.5 whitespace-nowrap">
                  <Sparkles size={15} className="text-purple-600" /> Miễn phí ảnh tham chiếu
                </span>
                <p className="text-purple-800 text-[11px] leading-relaxed">
                  Không phụ thu chi phí khi tải ảnh mẫu lên để chỉnh sửa (Image-to-Image / Edits). Đồng giá <strong>150 đ</strong>.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200 space-y-1">
                <span className="font-bold text-amber-900 flex items-center gap-1.5 whitespace-nowrap">
                  <Zap size={15} className="text-amber-600" /> Smart Cache 25ms
                </span>
                <p className="text-amber-800 text-[11px] leading-relaxed">
                  Cùng prompt và thông số đã được render trước đó sẽ được trả lời tức thì trong <strong>25ms</strong>, tiết kiệm tài nguyên.
                </p>
              </div>
            </div>
          </section>

          {/* Section 8: Errors */}
          <section id="errors" className="scroll-mt-24 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <AlertTriangle size={20} className="text-rose-500" />
              <h2 className="text-lg font-bold text-slate-900 whitespace-nowrap">8. Mã Lỗi & HTTP Status Codes</h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 text-[11px] uppercase bg-slate-50/60 whitespace-nowrap">
                    <th className="p-3 font-bold whitespace-nowrap">HTTP Code</th>
                    <th className="p-3 font-bold whitespace-nowrap">Tên Lỗi</th>
                    <th className="p-3 font-bold">Nguyên Nhân</th>
                    <th className="p-3 font-bold">Cách Xử Lý</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  <tr>
                    <td className="p-3 font-mono font-bold text-emerald-600 whitespace-nowrap">200 / 201</td>
                    <td className="p-3 font-medium whitespace-nowrap">Thành công</td>
                    <td className="p-3">Tác vụ tạo ảnh thành công.</td>
                    <td className="p-3 text-slate-500">Nhận <code>image_url</code> để hiển thị ảnh.</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-mono font-bold text-amber-600 whitespace-nowrap">400</td>
                    <td className="p-3 font-medium whitespace-nowrap">Bad Request</td>
                    <td className="p-3">Prompt trống hoặc thiếu tham số bắt buộc.</td>
                    <td className="p-3 text-slate-500">Kiểm tra lại JSON payload gửi lên.</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-mono font-bold text-rose-600 whitespace-nowrap">401</td>
                    <td className="p-3 font-medium whitespace-nowrap">Unauthorized</td>
                    <td className="p-3">API Key sai, thiếu Bearer Header hoặc đã bị thu hồi.</td>
                    <td className="p-3 text-slate-500">Kiểm tra lại khóa API tại trang Quản lý API Keys.</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-mono font-bold text-rose-600 whitespace-nowrap">402</td>
                    <td className="p-3 font-medium whitespace-nowrap">Payment Required</td>
                    <td className="p-3">Số dư Credit trong ví không đủ 150 đ.</td>
                    <td className="p-3 text-slate-500">Nạp thêm tiền qua SePay / VietQR tự động.</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-mono font-bold text-purple-600 whitespace-nowrap">429</td>
                    <td className="p-3 font-medium whitespace-nowrap">Too Many Requests</td>
                    <td className="p-3">Vượt quá giới hạn rate limit (60 req/min).</td>
                    <td className="p-3 text-slate-500">Giãn cách thời gian giữa các lần gửi request.</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-mono font-bold text-slate-600 whitespace-nowrap">500</td>
                    <td className="p-3 font-medium whitespace-nowrap">Server Error</td>
                    <td className="p-3">Sự cố từ máy chủ thượng nguồn NCC.</td>
                    <td className="p-3 text-slate-500">Tài khoản không bị trừ tiền, hệ thống tự động rollback.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};

export default ApiDocsPage;
