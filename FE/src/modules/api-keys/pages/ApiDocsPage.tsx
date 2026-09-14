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
  { id: 'overview', title: '1. Tổng quan & Base URL', badge: 'REST' },
  { id: 'quickstart', title: '2. Khởi đầu nhanh (Quickstart)', badge: '3 Bước', badgeColor: 'text-emerald-600 font-bold' },
  { id: 'authentication', title: '3. Xác thực Bearer Token', badge: 'Header', badgeColor: 'font-mono text-slate-400' },
  { id: 'specs', title: '4. Thông số Resolution & Quality', badge: '1K/2K/4K', badgeColor: 'text-purple-600 font-bold' },
  { id: 'parameters', title: '5. Endpoint & Bảng Tham Số', badge: 'POST', badgeColor: 'bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-mono font-bold' },
  { id: 'code-samples', title: '6. Mẫu Code Đa Ngôn Ngữ', badge: '4 Ngôn ngữ', badgeColor: 'text-brand-600 font-bold' },
  { id: 'smart-cache', title: '7. Smart Cache Siêu Tốc', badge: '⚡ 25ms', badgeColor: 'text-amber-600 font-bold' },
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

  const API_BASE_URL = window.location.origin.includes('517')
    ? 'http://127.0.0.1:8001/api/v1'
    : `${window.location.origin}/api/v1`;

  const CODE_EXAMPLES = {
    curl: `curl -X POST "${API_BASE_URL}/images/generations" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "prompt": "Một chú mèo phi hành gia trong không gian neon, chi tiết điện ảnh 8K",
    "model": "gpt-image-2",
    "resolution": "2k",
    "quality": "high",
    "aspect_ratio": "1:1",
    "force_refresh": false
  }'`,

    python: `import requests

url = "${API_BASE_URL}/images/generations"
headers = {
    "Authorization": "Bearer YOUR_API_KEY",
    "Content-Type": "application/json"
}
payload = {
    "prompt": "Một chú mèo phi hành gia trong không gian neon, chi tiết điện ảnh 8K",
    "model": "gpt-image-2",
    "resolution": "2k",      # '1k' | '2k' | '4k'
    "quality": "high",       # 'low' | 'medium' | 'high'
    "aspect_ratio": "1:1",   # '1:1' | '16:9' | '9:16'
    "force_refresh": False   # True: bỏ qua cache để tạo ảnh biến thể mới
}

response = requests.post(url, headers=headers, json=payload)
data = response.json()

if data.get("success"):
    image_url = data["data"]["image_url"]
    is_cached = data["data"]["is_cached"]
    print(f"Ảnh tạo thành công: {image_url}")
    print(f"Trạng thái Cache: {'⚡ Cache Hit (25ms)' if is_cached else 'Tạo mới từ NCC'}")
else:
    print(f"Lỗi: {data.get('message')}")`,

    nodejs: `import fetch from 'node-fetch';

const generateImage = async () => {
  const response = await fetch('${API_BASE_URL}/images/generations', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer YOUR_API_KEY',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      prompt: 'Một chú mèo phi hành gia trong không gian neon, chi tiết điện ảnh 8K',
      model: 'gpt-image-2',
      resolution: '2k',      // '1k' | '2k' | '4k'
      quality: 'high',       // 'low' | 'medium' | 'high'
      aspect_ratio: '1:1',
      force_refresh: false
    })
  });

  const result = await response.json();
  if (result.success) {
    console.log('Link ảnh:', result.data.image_url);
    console.log('Thời gian xử lý:', result.data.latency_ms, 'ms');
  } else {
    console.error('Lỗi:', result.message);
  }
};

generateImage();`,

    php: `<?php

$curl = curl_init();

$payload = [
    "prompt" => "Một chú mèo phi hành gia trong không gian neon, chi tiết điện ảnh 8K",
    "model" => "gpt-image-2",
    "resolution" => "2k",
    "quality" => "high",
    "aspect_ratio" => "1:1",
    "force_refresh" => false
];

curl_setopt_array($curl, [
    CURLOPT_URL => "${API_BASE_URL}/images/generations",
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => json_encode($payload),
    CURLOPT_HTTPHEADER => [
        "Authorization: Bearer YOUR_API_KEY",
        "Content-Type: application/json"
    ],
]);

$response = curl_exec($curl);
curl_close($curl);

$result = json_decode($response, true);
if ($result && $result['success']) {
    echo "Ảnh: " . $result['data']['image_url'];
} else {
    echo "Lỗi: " . ($result['message'] ?? 'Không xác định');
}
?>`,
  };

  const SAMPLE_RESPONSE = `{
  "success": true,
  "message": "Tạo ảnh thành công từ model gpt-image-2!",
  "data": {
    "job_id": "job_54c50aaec15749b9",
    "image_url": "http://127.0.0.1:8001/api/v1/generations/jobs/job_54c50aaec15749b9/image",
    "aspect_ratio": "2048x2048",
    "resolution": "2k",
    "quality": "high",
    "is_cached": true,
    "latency_ms": 26,
    "charge_amount": 150.0,
    "created_at": "2026-09-13T23:38:32.481912"
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
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-brand-500 text-white shadow-sm">
                API Docs v1.0
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-white/10 text-slate-300 border border-white/10">
                REST / JSON
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <Zap size={12} /> Model gpt-image-2
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Tài Liệu Tích Hợp Cổng API Tạo Ảnh AI
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed font-normal">
              Cổng API hiệu năng cao cho phép đối tác và ứng dụng khách tích hợp trực tiếp model{' '}
              <strong className="text-brand-400 font-bold">gpt-image-2</strong>. Hỗ trợ tùy chỉnh độc lập{' '}
              <strong>Resolution (1K/2K/4K)</strong>, <strong>Quality (High/Med/Low)</strong> và Smart Cache 25ms.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link to="/app/api-keys">
              <Button
                variant="primary"
                size="md"
                className="bg-brand-500 hover:bg-brand-600 text-white font-bold shadow-md shadow-brand-500/30"
                leftIcon={<KeyRound size={15} />}
              >
                Lấy API Key Ngay
              </Button>
            </Link>
            <Link to="/app/studio">
              <Button
                variant="outline"
                size="md"
                className="border-white/20 text-white hover:bg-white/10"
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
        {/* Left Sticky Navigation Menu (Cuộn theo mượt mà chuẩn Seedvis) */}
        <aside className="lg:col-span-3 sticky top-20 z-20 self-start max-h-[calc(100vh-6rem)] overflow-y-auto bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-4 custom-scrollbar-light">
          <div className="text-xs font-extrabold text-slate-400 uppercase tracking-wider px-2 flex items-center gap-1.5">
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
                  className={`flex items-center justify-between px-3 py-2 rounded-xl transition-all ${
                    isActive
                      ? 'bg-brand-50 text-brand-700 font-bold border-l-3 border-brand-500 pl-2.5 shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border-l-3 border-transparent'
                  }`}
                >
                  <span className="truncate">{item.title}</span>
                  {item.badge && (
                    <span className={`text-[10px] shrink-0 ml-1.5 ${item.badgeColor || 'text-slate-400'}`}>
                      {item.badge}
                    </span>
                  )}
                </a>
              );
            })}
          </nav>

          <div className="pt-3 border-t border-slate-100">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 space-y-2">
              <span className="text-[11px] font-bold text-slate-700 block">Bạn chưa có API Key?</span>
              <p className="text-[10px] text-slate-500 leading-normal">
                Tạo khóa bí mật miễn phí để bắt đầu kết nối ứng dụng của bạn ngay hôm nay.
              </p>
              <Link to="/app/api-keys" className="block">
                <Button variant="primary" size="sm" className="w-full text-xs">
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
              <h2 className="text-lg font-bold text-slate-900">1. Tổng Quan & Base URL</h2>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Tất cả các lệnh gọi API được thực thi qua giao thức HTTPS bảo mật, định dạng dữ liệu truyền tải hoàn toàn bằng{' '}
              <code className="bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded font-mono text-[11px]">JSON</code>.
            </p>

            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-700">Root Endpoint Base URL:</span>
              <div className="flex items-center justify-between bg-slate-900 text-emerald-400 p-3.5 rounded-xl font-mono text-xs shadow-inner">
                <span>{API_BASE_URL}</span>
                <button
                  type="button"
                  onClick={() => handleCopy(API_BASE_URL, 'base-url')}
                  className="text-slate-400 hover:text-white p-1 transition-colors"
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
              <h2 className="text-lg font-bold text-slate-900">2. Khởi Đầu Nhanh Trong 3 Bước</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                <span className="w-6 h-6 rounded-full bg-brand-500 text-white flex items-center justify-center text-xs font-bold">
                  1
                </span>
                <h3 className="font-bold text-slate-800 text-xs mt-2">Lấy API Key</h3>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Truy cập trang <Link to="/app/api-keys" className="text-brand-600 font-semibold underline">Quản lý API Keys</Link> để tạo khóa bí mật dạng <code>mf_live_sec_...</code>
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                <span className="w-6 h-6 rounded-full bg-brand-500 text-white flex items-center justify-center text-xs font-bold">
                  2
                </span>
                <h3 className="font-bold text-slate-800 text-xs mt-2">Gửi Yêu Cầu Tạo Ảnh</h3>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Thực hiện gửi request <code>POST /images/generations</code> với prompt và thông số mong muốn.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                <span className="w-6 h-6 rounded-full bg-brand-500 text-white flex items-center justify-center text-xs font-bold">
                  3
                </span>
                <h3 className="font-bold text-slate-800 text-xs mt-2">Nhận Ảnh Trực Tiếp</h3>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Hệ thống trả về trực tiếp <code>image_url</code> kèm độ phân giải thực tế (1024px, 2048px, 4096px).
                </p>
              </div>
            </div>
          </section>

          {/* Section 3: Authentication */}
          <section id="authentication" className="scroll-mt-24 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <ShieldCheck size={20} className="text-brand-500" />
              <h2 className="text-lg font-bold text-slate-900">3. Xác Thực (Authentication)</h2>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Mọi request gửi tới Cổng API bắt buộc phải kèm theo Header xác thực HTTP Bearer Token:
            </p>

            <div className="bg-slate-900 text-slate-200 p-4 rounded-xl font-mono text-xs shadow-inner space-y-1">
              <span className="text-slate-500"># Header bắt buộc:</span>
              <div className="text-emerald-400 font-bold">
                Authorization: Bearer mf_live_sec_your_api_token_here
              </div>
              <div className="text-slate-300">Content-Type: application/json</div>
            </div>

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-start gap-2.5 text-xs text-amber-800">
              <AlertTriangle size={16} className="shrink-0 mt-0.5 text-amber-600" />
              <span>
                <strong>Cảnh báo bảo mật:</strong> Không để lộ API Key trên frontend client-side công khai. Hãy luôn gọi API từ backend server của bạn!
              </span>
            </div>
          </section>

          {/* Section 4: Specifications */}
          <section id="specs" className="scroll-mt-24 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <Layers size={20} className="text-brand-500" />
              <h2 className="text-lg font-bold text-slate-900">4. Phân Biệt Độc Lập Resolution & Quality</h2>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Cổng API hỗ trợ điều chỉnh độc lập 2 trục thông số kỹ thuật (đã được đối chiếu pixel chính xác qua IHDR):
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-2">
                <span className="text-xs font-bold text-slate-800 block">Độ phân giải (Resolution):</span>
                <ul className="text-xs space-y-1.5 text-slate-600">
                  <li className="flex items-center justify-between">
                    <span><code>"1k"</code>: 1024 × 1024 pixels</span>
                    <span className="text-[10px] text-slate-400 font-semibold">Tốc độ nhanh</span>
                  </li>
                  <li className="flex items-center justify-between font-bold text-brand-600">
                    <span><code>"2k"</code>: 2048 × 2048 pixels</span>
                    <span className="text-[10px] bg-brand-100 text-brand-700 px-1.5 rounded">⭐️ Khuyên dùng</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span><code>"4k"</code>: 4096 × 4096 pixels</span>
                    <span className="text-[10px] text-slate-400 font-semibold">Siêu nét Ultra HD</span>
                  </li>
                </ul>
              </div>

              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-2">
                <span className="text-xs font-bold text-slate-800 block">Chất lượng (Quality):</span>
                <ul className="text-xs space-y-1.5 text-slate-600">
                  <li className="flex items-center justify-between font-bold text-purple-700">
                    <span><code>"high"</code>: Chi tiết tối đa</span>
                    <span className="text-[10px] bg-purple-100 px-1.5 rounded">Mặc định</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span><code>"medium"</code>: Tiêu chuẩn</span>
                    <span className="text-[10px] text-slate-400 font-semibold">Cân bằng</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span><code>"low"</code>: Tối ưu tốc độ</span>
                    <span className="text-[10px] text-slate-400 font-semibold">Phác thảo</span>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* Section 5 & 6: Endpoint & Parameters Table */}
          <section id="parameters" className="scroll-mt-24 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <Terminal size={20} className="text-brand-500" />
                <h2 className="text-lg font-bold text-slate-900">5. Endpoint & Bảng Tham Số (POST /images/generations)</h2>
              </div>
              <span className="text-xs font-mono font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                POST /api/v1/images/generations
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 text-[11px] uppercase bg-slate-50/60">
                    <th className="p-3 font-semibold">Tham số</th>
                    <th className="p-3 font-semibold">Kiểu dữ liệu</th>
                    <th className="p-3 font-semibold">Mặc định</th>
                    <th className="p-3 font-semibold">Bắt buộc</th>
                    <th className="p-3 font-semibold">Mô tả</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  <tr>
                    <td className="p-3 font-mono font-bold text-brand-600">prompt</td>
                    <td className="p-3 font-mono text-slate-500">string</td>
                    <td className="p-3 font-mono text-slate-400">-</td>
                    <td className="p-3"><span className="text-rose-600 font-bold">Có</span></td>
                    <td className="p-3">Mô tả chi tiết hình ảnh cần sinh (tối đa 4,000 ký tự).</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-mono font-bold text-slate-800">model</td>
                    <td className="p-3 font-mono text-slate-500">string</td>
                    <td className="p-3 font-mono text-slate-500">"gpt-image-2"</td>
                    <td className="p-3 text-slate-400">Không</td>
                    <td className="p-3">Định danh model AI thế hệ 2 chất lượng cao.</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-mono font-bold text-slate-800">resolution</td>
                    <td className="p-3 font-mono text-slate-500">string</td>
                    <td className="p-3 font-mono text-slate-500">"1k"</td>
                    <td className="p-3 text-slate-400">Không</td>
                    <td className="p-3">Độ phân giải pixel thực tế: <code>"1k"</code>, <code>"2k"</code>, <code>"4k"</code>.</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-mono font-bold text-slate-800">quality</td>
                    <td className="p-3 font-mono text-slate-500">string</td>
                    <td className="p-3 font-mono text-slate-500">"high"</td>
                    <td className="p-3 text-slate-400">Không</td>
                    <td className="p-3">Mức độ chi tiết lấy mẫu: <code>"low"</code>, <code>"medium"</code>, <code>"high"</code>.</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-mono font-bold text-slate-800">aspect_ratio</td>
                    <td className="p-3 font-mono text-slate-500">string</td>
                    <td className="p-3 font-mono text-slate-500">"1:1"</td>
                    <td className="p-3 text-slate-400">Không</td>
                    <td className="p-3">Tỷ lệ khung hình: <code>"1:1"</code> (Vuông), <code>"16:9"</code> (Ngang), <code>"9:16"</code> (Dọc).</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-mono font-bold text-slate-800">reference</td>
                    <td className="p-3 font-mono text-slate-500">string (URL)</td>
                    <td className="p-3 font-mono text-slate-400">null</td>
                    <td className="p-3 text-slate-400">Không</td>
                    <td className="p-3">Link URL ảnh gốc để tạo biến thể (Image-to-Image).</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-mono font-bold text-slate-800">force_refresh</td>
                    <td className="p-3 font-mono text-slate-500">boolean</td>
                    <td className="p-3 font-mono text-slate-500">false</td>
                    <td className="p-3 text-slate-400">Không</td>
                    <td className="p-3">Nếu đặt <code>true</code>, hệ thống sẽ bỏ qua Smart Cache để gọi NCC tạo biến thể mới.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Section 7: Code Playground & Snippets (Đa ngôn ngữ như Seedvis) */}
          <section id="code-samples" className="scroll-mt-24 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <Code2 size={20} className="text-brand-500" />
                <h2 className="text-lg font-bold text-slate-900">6. Mẫu Code Gọi API Đa Ngôn Ngữ</h2>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
                {(['curl', 'python', 'nodejs', 'php'] as const).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setActiveLang(lang)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
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
              <div className="flex items-center justify-between px-4 py-2.5 bg-slate-950/80 border-b border-slate-800 text-xs text-slate-400">
                <span className="font-mono">{activeLang === 'nodejs' ? 'index.js' : activeLang === 'python' ? 'app.py' : activeLang === 'php' ? 'index.php' : 'Terminal / Bash'}</span>
                <button
                  type="button"
                  onClick={() => handleCopy(CODE_EXAMPLES[activeLang], `snippet-${activeLang}`)}
                  className="flex items-center gap-1 text-slate-300 hover:text-white transition-colors bg-white/10 px-2.5 py-1 rounded-md text-[11px]"
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
              <div className="flex items-center justify-between">
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

          {/* Section 8: Smart Cache */}
          <section id="smart-cache" className="scroll-mt-24 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <Zap size={20} className="text-amber-500" />
              <h2 className="text-lg font-bold text-slate-900">7. Cơ Chế Smart Cache & Tối Ưu Chi Phí</h2>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Hệ thống tích hợp thuật toán băm đa tầng (SHA-256) dựa trên tổ hợp:{' '}
              <code>(model + prompt + resolution + quality + aspect_ratio + references)</code>:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200 space-y-1">
                <span className="font-bold text-emerald-900 flex items-center gap-1.5">
                  ⚡ Trúng Cache (Cache Hit)
                </span>
                <p className="text-emerald-800 text-[11px] leading-relaxed">
                  Phản hồi siêu tốc trong <strong>20 - 50ms</strong>. Vốn nhà cung cấp bằng <strong>0 đ</strong>, giúp bảo toàn số dư tài khoản của bạn.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-200 space-y-1">
                <span className="font-bold text-blue-900 flex items-center gap-1.5">
                  🔄 Tạo Mới (Bypass Cache)
                </span>
                <p className="text-blue-800 text-[11px] leading-relaxed">
                  Khi cần tạo góc nhìn / biến thể mới cho cùng 1 prompt, truyền <code>"force_refresh": true</code> để hệ thống gọi trực tiếp nhà cung cấp.
                </p>
              </div>
            </div>
          </section>

          {/* Section 9: Errors */}
          <section id="errors" className="scroll-mt-24 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <AlertTriangle size={20} className="text-rose-500" />
              <h2 className="text-lg font-bold text-slate-900">8. Mã Lỗi & HTTP Status Codes</h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 text-[11px] uppercase bg-slate-50/60">
                    <th className="p-3 font-semibold">HTTP Code</th>
                    <th className="p-3 font-semibold">Tên Lỗi</th>
                    <th className="p-3 font-semibold">Nguyên Nhân</th>
                    <th className="p-3 font-semibold">Cách Xử Lý</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  <tr>
                    <td className="p-3 font-mono font-bold text-emerald-600">200 / 201</td>
                    <td className="p-3 font-medium">Thành công</td>
                    <td className="p-3">Tác vụ tạo ảnh thành công.</td>
                    <td className="p-3 text-slate-500">Lấy <code>image_url</code> để hiển thị.</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-mono font-bold text-amber-600">400</td>
                    <td className="p-3 font-medium">Bad Request</td>
                    <td className="p-3">Prompt trống hoặc thiếu tham số bắt buộc.</td>
                    <td className="p-3 text-slate-500">Kiểm tra lại JSON body gửi đi.</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-mono font-bold text-rose-600">401</td>
                    <td className="p-3 font-medium">Unauthorized</td>
                    <td className="p-3">API Key sai, thiếu Bearer Header hoặc đã bị xóa.</td>
                    <td className="p-3 text-slate-500">Kiểm tra lại API Key trên trang quản trị.</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-mono font-bold text-rose-600">402</td>
                    <td className="p-3 font-medium">Payment Required</td>
                    <td className="p-3">Số dư Credit trong ví không đủ 150 đ.</td>
                    <td className="p-3 text-slate-500">Nạp thêm tiền qua SePay / VietQR.</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-mono font-bold text-purple-600">429</td>
                    <td className="p-3 font-medium">Too Many Requests</td>
                    <td className="p-3">Vượt quá giới hạn rate limit (60 req/min).</td>
                    <td className="p-3 text-slate-500">Giãn cách thời gian giữa các lần gọi.</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-mono font-bold text-slate-600">500</td>
                    <td className="p-3 font-medium">Server Error</td>
                    <td className="p-3">Sự cố từ máy chủ nhà cung cấp thượng nguồn.</td>
                    <td className="p-3 text-slate-500">Khách không bị trừ tiền, thử lại sau ít phút.</td>
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
