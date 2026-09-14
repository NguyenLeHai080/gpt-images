import React, { useState } from 'react';
import { Modal } from '../../../core/components/Modal/Modal';
import { Button } from '../../../core/components/Button/Button';
import {
  Sparkles,
  RefreshCw,
  CheckCircle2,
  Wand2,
  Dices,
  ImagePlus,
  Download,
  ExternalLink,
  X,
} from 'lucide-react';
import { generationsApi } from '../api';
import { alert } from '../../../core/alert';
import { ResolutionSelector } from './studio/ResolutionSelector';
import { QualitySelector } from './studio/QualitySelector';
import { AspectRatioSelector } from './studio/AspectRatioSelector';
import { PromptPresetChips } from './studio/PromptPresetChips';
import { SmartCacheToggle } from './studio/SmartCacheToggle';
import { ReferenceImageUploader } from './studio/ReferenceImageUploader';

interface StudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (job?: any) => void;
}

const SAMPLE_PROMPTS = [
  'Một chú mèo phi hành gia khám phá dải ngân hà neon, ánh sáng tím vàng huyền ảo, phong cách điện ảnh 8K',
  'Chân dung nghệ thuật cô gái Á Đông trong trang phục cyberpunk, ánh sáng mưa phản chiếu đèn neon, siêu chi tiết',
  'Ngôi nhà gỗ ấm cúng trên cây giữa rừng phong mùa thu, khói bốc lên từ ống khói, ánh nắng vàng êm dịu, 3D Pixar',
  'Siêu xe thể thao tương lai lướt trên đường cao tốc ven biển lúc hoàng hôn, phản chiếu mặt nước, photorealistic',
  'Tách cà phê latte art hình chú rồng đang bốc khói trên bàn gỗ phong cách vintage, ánh sáng dịu nhẹ, macro shot',
];

export const StudioModal: React.FC<StudioModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [prompt, setPrompt] = useState('');
  const [resolution, setResolution] = useState<'1k' | '2k' | '4k'>('2k');
  const [quality, setQuality] = useState<'low' | 'medium' | 'high'>('high');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [referenceUrl, setReferenceUrl] = useState('');
  const [showReferenceInput, setShowReferenceInput] = useState(true);
  const [forceRefresh, setForceRefresh] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Chọn prompt mẫu ngẫu nhiên
  const handleRandomPrompt = () => {
    const randomIndex = Math.floor(Math.random() * SAMPLE_PROMPTS.length);
    setPrompt(SAMPLE_PROMPTS[randomIndex]);
  };

  // Thêm style preset vào prompt
  const handleAddStyle = (suffix: string) => {
    if (!prompt.includes(suffix.trim())) {
      setPrompt((prev) => (prev.trim() ? `${prev.trim()}${suffix}` : suffix.replace(/^,\s*/, '')));
    }
  };

  // Tính toán kích thước pixel gửi cho API dựa trên Resolution và Aspect Ratio
  const computeApiDimensions = (res: '1k' | '2k' | '4k', ratio: string) => {
    if (ratio === '1:1') {
      if (res === '2k') return '2048x2048';
      if (res === '4k') return '4096x4096';
      return '1024x1024';
    }
    return ratio;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) {
      alert.toast('Vui lòng nhập prompt mô tả hình ảnh cần tạo', 'warning');
      return;
    }

    const currentPrompt = prompt.trim();
    const currentRef = referenceUrl.trim();
    const actualDimensions = computeApiDimensions(resolution, aspectRatio);

    // 1. Đóng modal NGAY LẬP TỨC theo đúng yêu cầu
    onClose();
    alert.toast('Đã khởi tạo job tạo ảnh! Bảng sẽ tự động hiển thị và cập nhật kết quả.', 'info');

    // 2. Reset form
    setPrompt('');
    setReferenceUrl('');
    setPreviewUrl(null);
    setIsGenerating(false);

    // 3. Gửi lệnh tạo ảnh bất đồng bộ (async) tới backend
    try {
      const res = await generationsApi.generateImage({
        prompt: currentPrompt,
        model: 'gpt-image-2',
        aspectRatio: actualDimensions,
        resolution,
        quality,
        reference: currentRef || undefined,
        references: currentRef ? [currentRef] : undefined,
        count: 1,
        executionMode: 'async',
        force_refresh: forceRefresh,
      });

      if (res.success && res.data) {
        if (res.data.is_cached) {
          alert.toast('⚡ Phục vụ tức thì từ Smart Cache (0đ vốn NCC, 25ms)!', 'success');
        }
        if (onSuccess) onSuccess(res.data);
      }
    } catch (err: any) {
      console.warn('[StudioModal] Lỗi khởi tạo job:', err);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      title={
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-500 via-orange-500 to-amber-400 text-white flex items-center justify-center shadow-md shadow-brand-500/25 shrink-0">
            <Sparkles size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-extrabold text-slate-900 tracking-tight">Studio Sáng Tạo Ảnh AI</span>
              <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-brand-50 text-brand-600 border border-brand-200">
                gpt-image-2
              </span>
            </div>
            <p className="text-xs text-slate-500 font-normal mt-0.5">
              Tùy chỉnh độc lập Độ phân giải (1K/2K/4K) & Chất lượng (High/Medium/Low)
            </p>
          </div>
        </div>
      }
      footer={
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 w-full">
          {/* Thông tin cấu hình tóm tắt */}
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="font-semibold text-slate-700">Chi phí:</span>
            <span className="font-bold text-brand-600 bg-brand-50 border border-brand-200 px-2 py-0.5 rounded-md">
              150 đ / ảnh
            </span>
            <span className="text-slate-400 hidden sm:inline">•</span>
            <span className="text-[11px] text-slate-500 hidden sm:inline">
              {resolution.toUpperCase()} • {quality.toUpperCase()} • {aspectRatio}
            </span>
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={onClose} type="button" disabled={isGenerating}>
              Hủy bỏ
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="submit"
              form="studio-modal-form"
              disabled={isGenerating}
              className="bg-gradient-to-r from-brand-500 to-amber-500 hover:from-brand-600 hover:to-amber-600 text-white font-bold shadow-md shadow-brand-500/20 px-4 py-2"
              leftIcon={isGenerating ? <RefreshCw size={14} className="animate-spin" /> : <Sparkles size={14} />}
            >
              {isGenerating
                ? 'Đang tạo ảnh...'
                : `Tạo ảnh ngay (${resolution.toUpperCase()} • ${quality.toUpperCase()})`}
            </Button>
          </div>
        </div>
      }
    >
      <form id="studio-modal-form" onSubmit={handleSubmit} className="space-y-4 text-xs">
        {/* Khối 1: Prompt Input */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
              <Wand2 size={13} className="text-brand-500" /> Mô tả hình ảnh cần tạo (Prompt)
              <span className="text-rose-500">*</span>
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleRandomPrompt}
                className="text-[11px] font-semibold text-brand-600 hover:text-brand-700 bg-brand-50/80 hover:bg-brand-100 border border-brand-200/80 px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 shadow-2xs"
                title="Bấm để tự động điền một ý tưởng mẫu"
              >
                <Dices size={12} /> Prompt mẫu
              </button>
              {prompt.trim() && (
                <button
                  type="button"
                  onClick={() => setPrompt('')}
                  className="text-[11px] text-slate-400 hover:text-slate-600 p-1 transition-colors"
                  title="Xóa prompt"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          </div>

          <textarea
            rows={3}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ví dụ: Một chú mèo phi hành gia trong không gian neon, phong cách điện ảnh 8K, ánh sáng lung linh rực rỡ..."
            className="w-full bg-slate-50/50 hover:bg-white focus:bg-white border border-slate-200 rounded-xl p-3 text-slate-800 placeholder:text-slate-400 outline-none focus:border-brand-500 focus:ring-3 focus:ring-brand-500/15 shadow-2xs font-sans leading-relaxed transition-all text-xs resize-y"
            required
          />

          {/* Quick Style Chips */}
          <PromptPresetChips onSelect={handleAddStyle} />
        </div>

        {/* Khối 2: Độ phân giải (Resolution) */}
        <ResolutionSelector resolution={resolution} onChange={setResolution} />

        {/* Khối 3: Chất Lượng (Quality) & Tỷ Lệ Khung Hình (Aspect Ratio) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <QualitySelector quality={quality} onChange={setQuality} />
          <AspectRatioSelector aspectRatio={aspectRatio} onChange={setAspectRatio} />
        </div>

        {/* Khối 4: Ảnh tham chiếu (Image-to-Image / Tải từ máy tính) */}
        <div className="border border-slate-200/90 rounded-xl p-3 bg-slate-50/40 space-y-2.5">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setShowReferenceInput(!showReferenceInput)}
              className="flex items-center gap-1.5 font-bold text-slate-800 text-xs hover:text-brand-600 transition-colors"
            >
              <ImagePlus size={14} className="text-brand-500" />
              <span>Ảnh tham chiếu (Image-to-Image / Tải ảnh từ máy tính)</span>
              <span className="text-[10px] text-slate-400 font-normal">
                {showReferenceInput ? '• Thu gọn' : '• Mở rộng (Tùy chọn)'}
              </span>
            </button>
            {referenceUrl && (
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                ✓ Đã có ảnh tham chiếu
              </span>
            )}
          </div>

          {showReferenceInput && (
            <div className="pt-1 animate-fade-in">
              <ReferenceImageUploader
                referenceUrl={referenceUrl}
                onChange={setReferenceUrl}
              />
            </div>
          )}
        </div>

        {/* Khối 5: Smart Cache Toggle */}
        <SmartCacheToggle forceRefresh={forceRefresh} onChange={setForceRefresh} />

        {/* Khối 6: Preview kết quả nếu vừa tạo xong */}
        {previewUrl && (
          <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-200/80 space-y-3 animate-scale-in">
            <div className="flex items-center justify-between">
              <div className="font-bold text-emerald-700 flex items-center gap-1.5 text-xs">
                <CheckCircle2 size={16} /> Ảnh vừa được tạo thành công:
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={previewUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 bg-white px-2.5 py-1 rounded-lg border border-emerald-200 shadow-2xs transition-all"
                >
                  <ExternalLink size={12} /> Xem ảnh gốc
                </a>
                <a
                  href={previewUrl}
                  download="gpt-image.png"
                  className="text-[11px] font-semibold text-white bg-emerald-600 hover:bg-emerald-700 flex items-center gap-1 px-2.5 py-1 rounded-lg shadow-2xs transition-all"
                >
                  <Download size={12} /> Tải về
                </a>
              </div>
            </div>
            <div className="rounded-xl overflow-hidden border border-emerald-200/60 bg-white p-1 shadow-sm">
              <img
                src={previewUrl}
                alt="Generated result"
                className="max-h-64 w-full object-contain mx-auto rounded-lg"
              />
            </div>
          </div>
        )}
      </form>
    </Modal>
  );
};
