import React, { useState } from 'react';
import { Sparkles, Copy, Check, Terminal, Code2, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { alert } from '../../../core/alert';

export const CustomerQuickGuideCard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'curl' | 'python'>('curl');
  const [copied, setCopied] = useState(false);

  const curlSnippet = `curl -X POST https://api-gpt-images.nexoratech.com.vn/api/v1/images/generations \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "gpt-image-2.5-flare",
    "prompt": "a cute puppy running in autumn park",
    "size": "1024x1024"
  }'`;

  const pythonSnippet = `from openai import OpenAI

client = OpenAI(
    api_key="YOUR_API_KEY",
    base_url="https://api-gpt-images.nexoratech.com.vn/api/v1"
)

response = client.images.generate(
    model="gpt-image-2.5-flare",
    prompt="a cute puppy running in autumn park",
    size="1024x1024"
)
print(response.data[0].url)`;

  const currentCode = activeTab === 'curl' ? curlSnippet : pythonSnippet;

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(currentCode);
      setCopied(true);
      alert.toast(`Đã sao chép mã ${activeTab.toUpperCase()}!`, 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert.toast('Không thể sao chép mã nguồn', 'error');
    }
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col justify-between h-full gap-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles size={17} className="text-brand-500" />
            <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
              Hướng Dẫn Tích Hợp Nhanh
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Tương thích chuẩn thư viện OpenAI Image API
          </p>
        </div>
        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 border border-brand-200">
          OpenAI Ready
        </span>
      </div>

      {/* Code Snippet Tabs */}
      <div className="space-y-2 flex-1 flex flex-col">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveTab('curl')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'curl'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Terminal size={12} /> cURL
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('python')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'python'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Code2 size={12} /> Python
            </button>
          </div>

          <button
            type="button"
            onClick={handleCopyCode}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            {copied ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
            <span>{copied ? 'Đã chép' : 'Sao chép'}</span>
          </button>
        </div>

        <div className="relative flex-1 min-h-[140px] rounded-xl bg-slate-950 p-3 text-[11px] font-mono text-slate-200 overflow-x-auto custom-scrollbar-dark border border-slate-800">
          <pre className="whitespace-pre">{currentCode}</pre>
        </div>
      </div>

      {/* 3 Steps Footer Guide */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
        <span className="truncate">
          Hỗ trợ 4 models AI: <strong className="font-bold text-slate-800">Flare, Sunburst, GPT-Image 2, NanoBanana</strong>
        </span>
        <Link
          to="/app/api-docs"
          className="text-brand-600 hover:text-brand-700 font-bold shrink-0 flex items-center gap-1 ml-2"
        >
          <span>Xem Docs</span>
          <ExternalLink size={12} />
        </Link>
      </div>
    </div>
  );
};
