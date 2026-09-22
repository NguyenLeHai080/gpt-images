import React, { useState, useEffect } from 'react';
import { Modal } from '../../../core/components/Modal/Modal';
import { Button } from '../../../core/components/Button/Button';
import { Select, type SelectOption } from '../../../core/components/Select';
import { generationsApi } from '../api';
import { billingApi } from '../../billing/api';
import { alert } from '../../../core/alert';
import { ReferenceImageUploader } from './studio/ReferenceImageUploader';
import { useAuth } from '../../../core/hooks/useAuth';
import type { ProviderStatus } from '../types';

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

const ASPECT_RATIO_OPTIONS: SelectOption[] = [
  { value: '1:1', label: 'Vuông 1:1', sublabel: 'Avatar, Mạng xã hội, Bài đăng vuông' },
  { value: '16:9', label: 'Ngang 16:9', sublabel: 'Màn hình Desktop, Banner ngang, YouTube' },
  { value: '9:16', label: 'Dọc 9:16', sublabel: 'Điện thoại, TikTok, Reels, Story' },
  { value: '4:3', label: 'Chuẩn 4:3', sublabel: 'Tỷ lệ truyền thống, thuyết trình' },
  { value: '3:4', label: 'Chân dung 3:4', sublabel: 'Ảnh chân dung nghệ thuật đứng' },
  { value: '3:2', label: 'Ngang 3:2', sublabel: 'Nhiếp ảnh phong cảnh' },
  { value: '2:3', label: 'Dọc 2:3', sublabel: 'Nhiếp ảnh chân dung đứng' },
];

const RESOLUTION_OPTIONS: SelectOption[] = [
  { value: '1k', label: '1K Standard (~1024px)', sublabel: 'Độ phân giải tiêu chuẩn, tối ưu tốc độ' },
  { value: '2k', label: '2K Crisp HD (~2048px)', sublabel: 'Độ nét cao sắc nét, khuyên dùng' },
  { value: '4k', label: '4K Ultra HD (~4096px)', sublabel: 'Siêu phân giải cực nét cho in ấn & đồ họa lớn' },
];

const QUALITY_OPTIONS: SelectOption[] = [
  { value: 'low', label: 'Low Quality (Bản nháp nhanh)', sublabel: 'Ít bước render, tốc độ siêu tốc, tiết kiệm' },
  { value: 'medium', label: 'Medium Quality (Cân bằng - Mặc định)', sublabel: 'Đầy đủ chi tiết, màu sắc chân thực chuẩn Studio' },
  { value: 'high', label: 'High Quality (Siêu chi tiết)', sublabel: 'Tối đa bước khử nhiễu, ánh sáng và texture đỉnh cao' },
];

const MODEL_SELECT_OPTIONS: SelectOption[] = [
  { value: 'gpt-image-2.5-flare', label: 'GPT Image 2.5 Flare (Khuyên dùng)', sublabel: 'Siêu sắc nét, ánh sáng HDR điện ảnh chân thực' },
  { value: 'gpt-image-2.5-sunburst', label: 'GPT Image 2.5 Sunburst (Nghệ thuật)', sublabel: 'Màu sắc nghệ thuật rực rỡ, tương phản cao' },
  { value: 'gpt-image-2', label: 'GPT Image 2 (Tiêu chuẩn 2.0)', sublabel: 'Bản 2.0 cân bằng tốc độ và chất lượng' },
  { value: 'gemini-3.1-flash-image-preview', label: 'Gemini 3.1 Flash Image (NanoBanana)', sublabel: 'Tạo ảnh siêu tốc độ, tiết kiệm thời gian tối đa' },
];

export const StudioModal: React.FC<StudioModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';

  const [mode, setMode] = useState<'create' | 'edit'>('create');
  const [prompt, setPrompt] = useState('');
  const [model, setModel] = useState('gpt-image-2.5-flare');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [resolution, setResolution] = useState<'1k' | '2k' | '4k'>('1k');
  const [quality, setQuality] = useState<'low' | 'medium' | 'high'>('medium');
  const [referenceUrls, setReferenceUrls] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [providerStatus, setProviderStatus] = useState<ProviderStatus | null>(null);
  const [customerBalance, setCustomerBalance] = useState<number | null>(null);
  const [balanceAmountStr, setBalanceAmountStr] = useState<string>('0 đ');

  useEffect(() => {
    if (isOpen) {
      if (isAdmin) {
        generationsApi.getProviderStatus().then((res) => {
          if (res.data) {
            setProviderStatus(res.data);
          }
        }).catch((e) => console.warn('[StudioModal] Lỗi lấy trạng thái NCC:', e));
      } else {
        billingApi.getWallet().then((res) => {
          if (res.data) {
            setBalanceAmountStr(res.data.balance_amount || '0 đ');
            if (res.data.balance != null) {
              setCustomerBalance(res.data.balance);
            }
          }
        }).catch((e) => console.warn('[StudioModal] Lỗi lấy số dư ví:', e));
      }
    }
  }, [isOpen, isAdmin]);

  // Điền prompt mẫu ngẫu nhiên
  const handleRandomPrompt = () => {
    const randomIndex = Math.floor(Math.random() * SAMPLE_PROMPTS.length);
    setPrompt(SAMPLE_PROMPTS[randomIndex]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) {
      alert.toast('Vui lòng nhập mô tả hình ảnh cần tạo', 'warning');
      return;
    }

    if (!isAdmin && customerBalance !== null && customerBalance < 150) {
      alert.error(
        'Số dư không đủ',
        `Số dư ví hiện tại là ${balanceAmountStr}. Cần tối thiểu 150 đ để tạo ảnh. Vui lòng nạp thêm tiền qua SePay / VietQR!`
      );
      return;
    }

    if (isAdmin && providerStatus && !providerStatus.is_connected) {
      alert.error(
        'Chưa cấu hình Nhà Cung Cấp',
        'Hệ thống chưa kết nối Nhà Cung Cấp AI (NCC) khả dụng. Vui lòng cấu hình API Key nhà cung cấp tại Quản lý Nhà Cung Cấp trước khi tạo ảnh!'
      );
      return;
    }

    if (mode === 'edit' && referenceUrls.length === 0) {
      alert.toast('Vui lòng tải ảnh cần sửa lên hoặc dán đường dẫn ảnh', 'warning');
      return;
    }

    const currentPrompt = prompt.trim();
    const currentRefs = [...referenceUrls];
    const isEditMode = mode === 'edit' || currentRefs.length > 0;

    // Đóng modal và báo cho người dùng
    onClose();
    alert.toast(
      isEditMode
        ? 'Đang gửi yêu cầu sửa ảnh AI... Bảng sẽ tự động cập nhật kết quả!'
        : 'Đang khởi tạo tạo ảnh... Bảng sẽ hiển thị ảnh ngay khi tạo xong!',
      'info'
    );

    // Reset form
    setPrompt('');
    setReferenceUrls([]);
    setIsGenerating(false);

    try {
      const res = await generationsApi.generateImage({
        prompt: currentPrompt,
        model,
        aspectRatio,
        aspect_ratio: aspectRatio,
        resolution,
        quality,
        reference: currentRefs[0] || undefined,
        references: currentRefs.length > 0 ? currentRefs : undefined,
        count: 1,
        executionMode: 'async',
      });

      if (res.success && res.data) {
        if (res.data.is_cached) {
          alert.toast('⚡ Ảnh đã được tạo siêu tốc trong 25ms!', 'success');
        }
        if (onSuccess) onSuccess(res.data);
      }
    } catch (err: any) {
      const errMsg = err?.response?.data?.detail || err?.response?.data?.message || err?.message || 'Không thể tạo ảnh';
      if (err?.response?.status === 402 || errMsg.includes('Số dư') || errMsg.includes('không đủ')) {
        alert.error('Hết số dư tài khoản', `${errMsg}. Vui lòng nạp thêm tiền để tiếp tục tạo ảnh!`);
      } else {
        alert.error('Lỗi khởi tạo job', errMsg);
      }
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      title={
        <div className="flex items-center justify-between gap-4 w-full pr-8">
          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight whitespace-nowrap">
              Tạo Ảnh Bằng AI
            </h3>
            <p className="text-xs text-slate-500 font-normal mt-0.5 whitespace-nowrap">
              {isAdmin ? (
                <>
                  Chế độ Quản trị viên: <strong className="text-purple-600 font-bold">Cổng NCC Trực Tiếp</strong> • Giá vốn ~75 đ/ảnh • Không trừ ví cá nhân
                </>
              ) : (
                <>
                  Đồng giá <strong className="text-brand-600 font-bold">150 đ</strong> / ảnh • Chỉ trừ tiền khi tạo thành công
                </>
              )}
            </p>
          </div>
          {isAdmin ? (
            <div className={`px-2.5 py-1 rounded-xl border text-xs font-mono font-bold flex items-center gap-1.5 shrink-0 ${
              providerStatus?.is_connected
                ? 'bg-purple-50 text-purple-700 border-purple-200'
                : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}>
              <span>
                Ví Tổng NCC:{' '}
                {providerStatus
                  ? (providerStatus.budget_remaining && providerStatus.budget_remaining > 0
                      ? `${providerStatus.budget_remaining.toLocaleString('vi-VN')} đ`
                      : (providerStatus.is_connected ? 'Kết nối NCC' : 'Chưa cấu hình'))
                  : 'Đang kết nối...'}
              </span>
              {providerStatus?.budget_remaining && providerStatus.budget_remaining > 0 ? (
                <span className="text-[10px] font-normal opacity-80">
                  (~{Math.floor(providerStatus.budget_remaining / 75)} ảnh)
                </span>
              ) : null}
            </div>
          ) : (
            customerBalance !== null && (
              <div className={`px-2.5 py-1 rounded-xl border text-xs font-mono font-bold flex items-center gap-1.5 shrink-0 ${
                customerBalance >= 150
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse'
              }`}>
                <span>Ví: {balanceAmountStr}</span>
                <span className="text-[10px] font-normal opacity-80">
                  ({customerBalance >= 150 ? `~${Math.floor(customerBalance / 150)} ảnh` : 'Hết số dư'})
                </span>
              </div>
            )
          )}
        </div>
      }
      footer={
        <div className="flex items-center justify-between gap-3 w-full whitespace-nowrap">
          {/* Tóm tắt chi phí an tâm */}
          <div className="flex items-center gap-2 text-xs whitespace-nowrap">
            <span className={`font-extrabold px-2.5 py-1 rounded-lg whitespace-nowrap border ${
              isAdmin
                ? 'text-purple-700 bg-purple-50 border-purple-200'
                : 'text-brand-600 bg-brand-50 border-brand-200'
            }`}>
              {isAdmin ? 'Vốn NCC ~75 đ / request' : '150 đ / ảnh'}
            </span>
            <span className="text-slate-400">•</span>
            <span className="text-[11px] text-emerald-600 font-medium whitespace-nowrap">
              {isAdmin ? 'Đồng bộ dòng tiền NCC' : 'Hoàn 100% nếu lỗi'}
            </span>
          </div>

          {/* Nút hành động */}
          <div className="flex items-center justify-end gap-2 whitespace-nowrap">
            <Button variant="ghost" size="sm" onClick={onClose} type="button" disabled={isGenerating}>
              Hủy
            </Button>
            {!isAdmin && customerBalance !== null && customerBalance < 150 ? (
              <Button
                variant="primary"
                size="md"
                type="button"
                onClick={() => {
                  onClose();
                  window.location.href = '/app/billing';
                }}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-5 whitespace-nowrap"
              >
                Nạp Tiền Thêm (Còn {balanceAmountStr})
              </Button>
            ) : (
              <Button
                variant="primary"
                size="md"
                type="submit"
                form="studio-modal-form"
                disabled={isGenerating}
                className="bg-brand-500 hover:bg-brand-600 text-white font-bold px-5 whitespace-nowrap"
              >
                {isGenerating ? 'Đang tạo...' : 'Tạo Ảnh Ngay (150 đ)'}
              </Button>
            )}
          </div>
        </div>
      }
    >
      <form id="studio-modal-form" onSubmit={handleSubmit} className="space-y-4 pb-8 text-xs">
        {/* Chế độ: Tạo ảnh từ mô tả vs Chỉnh sửa ảnh có sẵn */}
        <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200/80">
          <button
            type="button"
            onClick={() => setMode('create')}
            className={`flex-1 py-1.5 px-3 rounded-lg font-bold text-xs whitespace-nowrap transition-all ${
              mode === 'create'
                ? 'bg-white text-brand-600 shadow-2xs border border-slate-200/60'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Tạo ảnh từ mô tả
          </button>

          <button
            type="button"
            onClick={() => setMode('edit')}
            className={`flex-1 py-1.5 px-3 rounded-lg font-bold text-xs whitespace-nowrap transition-all ${
              mode === 'edit'
                ? 'bg-white text-purple-600 shadow-2xs border border-slate-200/60'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Chỉnh sửa ảnh có sẵn
          </button>
        </div>

        {/* Khung tải ảnh lên nếu ở chế độ Chỉnh sửa ảnh */}
        {mode === 'edit' && (
          <div className="border border-purple-200 rounded-xl p-3 bg-purple-50/30 space-y-2 animate-fade-in">
            <div className="flex items-center justify-between whitespace-nowrap">
              <label className="font-bold text-purple-900 text-xs">
                Ảnh gốc cần sửa <span className="text-rose-500">*</span>
              </label>
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Miễn phí tải ảnh
              </span>
            </div>
            <ReferenceImageUploader
              referenceUrls={referenceUrls}
              onChangeUrls={setReferenceUrls}
              maxImages={5}
            />
          </div>
        )}

        {/* Ô nhập mô tả (Prompt) */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between whitespace-nowrap">
            <label className="font-bold text-slate-800 text-xs">
              {mode === 'edit'
                ? 'Chi tiết cần sửa hoặc thêm bớt'
                : 'Mô tả hình ảnh (Prompt)'}
              <span className="text-rose-500 ml-0.5">*</span>
            </label>

            <div className="flex items-center gap-2 whitespace-nowrap">
              <button
                type="button"
                onClick={handleRandomPrompt}
                className="text-[11px] font-semibold text-brand-600 hover:text-brand-700 bg-brand-50 hover:bg-brand-100 border border-brand-200 px-2 py-0.5 rounded transition-all whitespace-nowrap"
              >
                Thử prompt mẫu
              </button>

              {prompt.trim() && (
                <button
                  type="button"
                  onClick={() => setPrompt('')}
                  className="text-[11px] text-slate-400 hover:text-slate-600 whitespace-nowrap"
                >
                  Xóa
                </button>
              )}
            </div>
          </div>

          <textarea
            rows={3}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={
              mode === 'edit'
                ? 'Ví dụ: Thay áo đỏ thành áo vest đen sang trọng, thêm kính râm thời trang...'
                : 'Ví dụ: Chú mèo phi hành gia khám phá vũ trụ neon, ánh sáng tím vàng huyền ảo, 8K...'
            }
            className="w-full bg-slate-50/70 hover:bg-white focus:bg-white border border-slate-200 rounded-xl p-3 text-slate-800 placeholder:text-slate-400 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15 leading-relaxed text-xs resize-y transition-all"
            required
          />
        </div>

        {/* 4 Cấu hình: Model, Tỷ lệ, Resolution (1k, 2k, 4k) & Quality (low, medium, high) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5 whitespace-nowrap">
              Mô hình AI (Model)
            </label>
            <Select
              value={model}
              onChange={(v) => setModel(String(v))}
              size="md"
              placement="top"
              options={MODEL_SELECT_OPTIONS}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5 whitespace-nowrap">
              Tỷ lệ khung hình (Aspect Ratio)
            </label>
            <Select
              value={aspectRatio}
              onChange={(v) => setAspectRatio(String(v))}
              size="md"
              placement="top"
              options={ASPECT_RATIO_OPTIONS}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-800 whitespace-nowrap">
                Độ phân giải (Resolution)
              </label>
              <span className="text-[10px] text-brand-600 font-semibold bg-brand-50 px-1.5 py-0.2 rounded border border-brand-200">
                {resolution.toUpperCase()}
              </span>
            </div>
            <Select
              value={resolution}
              onChange={(v) => setResolution(v as any)}
              size="md"
              placement="top"
              options={RESOLUTION_OPTIONS}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-800 whitespace-nowrap">
                Chất lượng render (Quality)
              </label>
              <span className={`text-[10px] font-semibold px-1.5 py-0.2 rounded border ${
                quality === 'high'
                  ? 'text-purple-700 bg-purple-50 border-purple-200'
                  : quality === 'low'
                  ? 'text-amber-700 bg-amber-50 border-amber-200'
                  : 'text-emerald-700 bg-emerald-50 border-emerald-200'
              }`}>
                {quality === 'high' ? 'High Detail' : quality === 'low' ? 'Low Draft' : 'Medium Standard'}
              </span>
            </div>
            <Select
              value={quality}
              onChange={(v) => setQuality(v as any)}
              size="md"
              placement="top"
              options={QUALITY_OPTIONS}
            />
          </div>
        </div>

        {/* Chế độ Auto-Retry */}
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200/70 text-emerald-800 text-[11px]">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>
              <strong>Chế độ Auto-Retry: Đang bật</strong> • Tự động khắc phục & thử lại khi NCC tạm thời quá tải hoặc nghẽn mạng.
            </span>
          </div>
          <span className="font-bold text-emerald-700 bg-white px-2 py-0.5 rounded border border-emerald-200 shadow-2xs">
            Tự động
          </span>
        </div>

        {/* Thông tin giải thích phân biệt Quality vs Resolution */}
        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-600 flex items-start gap-2">
          <span className="text-brand-500 font-bold text-xs mt-0.5">💡</span>
          <div>
            <strong className="text-slate-800">Phân biệt tham số:</strong>{' '}
            <span className="font-semibold text-sky-700">Resolution (1k / 2k / 4k)</span> là độ phân giải điểm ảnh pixel (1024px / 2048px / 4096px). Trong khi{' '}
            <span className="font-semibold text-purple-700">Quality (low / medium / high)</span> là chất lượng lấy mẫu render và số bước khử nhiễu chi tiết.
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default StudioModal;
