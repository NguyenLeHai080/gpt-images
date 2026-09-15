import React, { useState, useEffect } from 'react';
import { Modal } from '../../../core/components/Modal/Modal';
import { Button } from '../../../core/components/Button/Button';
import { Input } from '../../../core/components/Input/Input';
import { Checkbox } from '../../../core/components/Checkbox/Checkbox';
import { Server, Sparkles, KeyRound, Globe, DollarSign, FileText } from 'lucide-react';
import type { AIProvider, CreateProviderInput, UpdateProviderInput } from '../types';

interface ProviderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateProviderInput | UpdateProviderInput) => Promise<void>;
  providerToEdit?: AIProvider | null;
  isSubmitting?: boolean;
}

export const ProviderModal: React.FC<ProviderModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  providerToEdit,
  isSubmitting = false,
}) => {
  const isEditing = Boolean(providerToEdit);

  const [name, setName] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [defaultModel, setDefaultModel] = useState('gpt-image-2.5-flare');
  const [modelsText, setModelsText] = useState('gpt-image-2.5-flare, gpt-image-2.5-sunburst, gpt-image-2, nanobanana-2');
  const [costPerImage, setCostPerImage] = useState<number>(75);
  const [isPrimary, setIsPrimary] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (providerToEdit) {
      setName(providerToEdit.name);
      setBaseUrl(providerToEdit.base_url);
      setApiKey(providerToEdit.api_key || '');
      setDefaultModel(providerToEdit.default_model);
      setModelsText(providerToEdit.models_supported.join(', '));
      setCostPerImage(providerToEdit.cost_per_image);
      setIsPrimary(providerToEdit.is_primary);
      setIsActive(providerToEdit.is_active);
      setNotes(providerToEdit.notes || '');
    } else {
      setName('');
      setBaseUrl('https://api.xompet.io.vn/v1');
      setApiKey('');
      setDefaultModel('gpt-image-2.5-flare');
      setModelsText('gpt-image-2.5-flare, gpt-image-2.5-sunburst, gpt-image-2, nanobanana-2');
      setCostPerImage(75);
      setIsPrimary(false);
      setIsActive(true);
      setNotes('');
    }
  }, [providerToEdit, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !baseUrl.trim()) return;

    const parsedModels = modelsText
      .split(',')
      .map((m) => m.trim())
      .filter(Boolean);

    if (parsedModels.length === 0) {
      parsedModels.push(defaultModel);
    }

    if (isEditing) {
      const updatePayload: UpdateProviderInput = {
        name,
        base_url: baseUrl,
        default_model: defaultModel,
        models_supported: parsedModels,
        cost_per_image: Number(costPerImage),
        is_primary: isPrimary,
        is_active: isActive,
        notes,
      };
      if (apiKey && !apiKey.startsWith('sk-••')) {
        updatePayload.api_key = apiKey;
      }
      await onSubmit(updatePayload);
    } else {
      const createPayload: CreateProviderInput = {
        name,
        base_url: baseUrl,
        api_key: apiKey,
        default_model: defaultModel,
        models_supported: parsedModels,
        cost_per_image: Number(costPerImage),
        is_primary: isPrimary,
        is_active: isActive,
        notes,
      };
      await onSubmit(createPayload);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? `Chỉnh sửa: ${providerToEdit?.name}` : 'Thêm Nhà Cung Cấp AI Mới'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 py-1 text-sm">
        {/* Provider Name */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
            <Server size={14} className="text-brand-500" />
            Tên Nhà Cung Cấp / Gateway *
          </label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ví dụ: Xompet AI Gateway, Together AI, Azure OpenAI..."
            required
          />
        </div>

        {/* Base URL */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
            <Globe size={14} className="text-brand-500" />
            Cổng Upstream Base URL *
          </label>
          <Input
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            placeholder="https://api.xompet.io.vn/v1 hoặc https://api.openai.com/v1"
            required
          />
          <span className="text-[11px] text-slate-400 mt-1 block">
            Hỗ trợ endpoint chuẩn OpenAI: <code className="text-slate-600 font-mono">/v1/images/generations</code> và <code className="text-slate-600 font-mono">/v1/images/edits</code>.
          </span>
        </div>

        {/* API Key */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
            <KeyRound size={14} className="text-brand-500" />
            API Key (Bearer Token) {isEditing ? '(Để trống nếu không đổi)' : '*'}
          </label>
          <Input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder={isEditing ? '••••••••••••••••••••••••••••••••' : 'sk-...'}
            required={!isEditing}
          />
        </div>

        {/* Default Model & Supported Models */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <Sparkles size={14} className="text-brand-500" />
              Model Mặc Định
            </label>
            <Input
              value={defaultModel}
              onChange={(e) => setDefaultModel(e.target.value)}
              placeholder="gpt-image-2.5-flare"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <DollarSign size={14} className="text-brand-500" />
              Giá vốn / ảnh thành công (VND)
            </label>
            <Input
              type="number"
              value={costPerImage}
              onChange={(e) => setCostPerImage(Number(e.target.value))}
              placeholder="75"
              min={0}
              step={1}
              required
            />
          </div>
        </div>

        {/* Supported Models List */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Danh sách Model hỗ trợ (Phân cách bởi dấu phẩy)
          </label>
          <Input
            value={modelsText}
            onChange={(e) => setModelsText(e.target.value)}
            placeholder="gpt-image-2.5-flare, gpt-image-2.5-sunburst, gpt-image-2, nanobanana-2"
          />
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
            <FileText size={14} className="text-slate-400" />
            Ghi chú nội bộ
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            placeholder="Chính sách tính tiền, ghi nhớ kỹ thuật, liên hệ hỗ trợ NCC..."
          />
        </div>

        {/* Checkbox Options */}
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-2">
          <Checkbox
            checked={isPrimary}
            onChange={(checked) => setIsPrimary(checked)}
            label={<span className="text-xs font-bold text-slate-800">Đặt làm Nhà Cung Cấp chính (Primary Provider) ngay</span>}
          />
          <Checkbox
            checked={isActive}
            onChange={(checked) => setIsActive(checked)}
            label={<span className="text-xs text-slate-700">Kích hoạt nhà cung cấp này (sẵn sàng xử lý request)</span>}
          />
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Hủy bỏ
          </Button>
          <Button type="submit" variant="primary" disabled={isSubmitting} className="font-bold">
            {isSubmitting ? 'Đang lưu...' : isEditing ? 'Cập nhật cấu hình' : 'Tạo Nhà Cung Cấp'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
