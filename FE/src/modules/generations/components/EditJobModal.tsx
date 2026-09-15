import React, { useState, useEffect } from 'react';
import { Modal } from '../../../core/components/Modal/Modal';
import { Button } from '../../../core/components/Button/Button';
import { Edit2 } from 'lucide-react';
import { alert } from '../../../core/alert';
import { generationsApi } from '../api';
import type { JobLogItem } from '../types';

interface EditJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: JobLogItem | null;
  onSuccess: () => void;
}

export const EditJobModal: React.FC<EditJobModalProps> = ({
  isOpen,
  onClose,
  job,
  onSuccess,
}) => {
  const [prompt, setPrompt] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (job) {
      setPrompt(job.prompt || '');
    }
  }, [job]);

  if (!job) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) {
      alert.toast('Mô tả prompt không được để trống', 'warning');
      return;
    }

    setIsSaving(true);
    try {
      const res = await generationsApi.updateJob(job.id, { prompt: prompt.trim() });
      if (res.success) {
        onSuccess();
        onClose();
      }
    } catch (err) {
      console.warn('[EditJobModal] Error updating job:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      title={
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200 shrink-0">
            <Edit2 size={16} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-base font-extrabold text-slate-900">Chỉnh Sửa Mô Tả (Prompt)</span>
            </div>
            <p className="text-xs text-slate-500 font-mono mt-0.5">Job ID: {job.id}</p>
          </div>
        </div>
      }
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose} type="button" disabled={isSaving}>
            Hủy bỏ
          </Button>
          <Button
            variant="primary"
            size="sm"
            type="submit"
            form="edit-job-form"
            disabled={isSaving}
          >
            {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
          </Button>
        </>
      }
    >
      <form id="edit-job-form" onSubmit={handleSave} className="space-y-4 text-xs">
        <div>
          <label className="block font-semibold text-slate-700 mb-1.5">
            Mô tả hình ảnh (Prompt):
          </label>
          <textarea
            rows={4}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Nhập nội dung prompt mới..."
            className="w-full bg-white border border-slate-200 rounded-xl p-3 text-slate-800 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 shadow-sm font-sans leading-relaxed transition-all"
            required
          />
        </div>

        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 grid grid-cols-3 gap-2 text-slate-600 text-xs">
          <div>
            <span className="text-[10px] text-slate-400 block">Model:</span>
            <span className="font-semibold text-slate-800 truncate block">{job.model}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block">Độ phân giải / Tỷ lệ:</span>
            <span className="font-semibold text-slate-800 truncate block">{job.resolution || '1k'} • {job.aspect_ratio}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block">Chất lượng (Quality):</span>
            <span className="font-bold text-purple-700 uppercase truncate block">{job.quality || 'medium'}</span>
          </div>
        </div>
      </form>
    </Modal>
  );
};
