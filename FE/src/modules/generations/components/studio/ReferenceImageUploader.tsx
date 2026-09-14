import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  Link2,
  X,
  CheckCircle2,
  RefreshCw,
  Eye,
} from 'lucide-react';
import { generationsApi } from '../../api';
import { alert } from '../../../../core/alert';

interface ReferenceImageUploaderProps {
  referenceUrl: string;
  onChange: (url: string) => void;
}

export const ReferenceImageUploader: React.FC<ReferenceImageUploaderProps> = ({
  referenceUrl,
  onChange,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'url'>('upload');
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [fileInfo, setFileInfo] = useState<{ name: string; size: string } | null>(null);
  const [showLightbox, setShowLightbox] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync state if referenceUrl already has a value initially
  useEffect(() => {
    if (referenceUrl && !localPreview) {
      setLocalPreview(referenceUrl);
      if (!referenceUrl.startsWith('data:') && !referenceUrl.includes('/static/uploads/')) {
        setActiveTab('url');
      }
    }
  }, [referenceUrl]);

  // Format file size
  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Process a selected file from computer
  const handleFileProcess = async (file: File) => {
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      alert.toast('Vui lòng chọn tệp hình ảnh hợp lệ (PNG, JPG, JPEG, WEBP)', 'warning');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      alert.toast('Dung lượng tệp vượt quá giới hạn tối đa 15MB', 'warning');
      return;
    }

    // Local instant preview
    const objectUrl = URL.createObjectURL(file);
    setLocalPreview(objectUrl);
    setFileInfo({
      name: file.name,
      size: formatBytes(file.size),
    });

    setIsUploading(true);
    try {
      const res = await generationsApi.uploadImage(file);
      if (res.success && res.data) {
        // Dùng URL đã được lưu trên backend
        onChange(res.data.url);
        // Có thể lưu base64 hoặc url
        setLocalPreview(res.data.url || res.data.base64 || objectUrl);
      } else {
        // Fallback: Chuyển sang base64 data URI nếu server upload gặp trục trặc
        const reader = new FileReader();
        reader.onload = () => {
          const b64 = reader.result as string;
          onChange(b64);
          setLocalPreview(b64);
        };
        reader.readAsDataURL(file);
      }
    } catch (err) {
      console.warn('[Upload] Server upload fallback to Base64 FileReader:', err);
      const reader = new FileReader();
      reader.onload = () => {
        const b64 = reader.result as string;
        onChange(b64);
        setLocalPreview(b64);
      };
      reader.readAsDataURL(file);
    } finally {
      setIsUploading(false);
    }
  };

  // Drag & drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  // Clipboard Paste listener (Ctrl+V / Cmd+V)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const file = items[i].getAsFile();
          if (file) {
            handleFileProcess(file);
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  // Xóa ảnh đã chọn
  const handleRemoveImage = () => {
    setLocalPreview(null);
    setFileInfo(null);
    onChange('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const hasImage = Boolean(localPreview || referenceUrl);

  return (
    <div className="space-y-2.5">
      {/* Tab Switcher & Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 bg-slate-100/90 p-0.5 rounded-lg border border-slate-200 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-bold transition-all ${
              activeTab === 'upload'
                ? 'bg-white text-brand-600 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Upload size={12} />
            <span>Tải từ máy tính</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('url')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-bold transition-all ${
              activeTab === 'url'
                ? 'bg-white text-brand-600 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Link2 size={12} />
            <span>Dán link URL</span>
          </button>
        </div>

        {hasImage && (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            <CheckCircle2 size={12} className="text-emerald-600" />
            Đã sẵn sàng
          </span>
        )}
      </div>

      {/* Mode 1: Tải từ máy tính */}
      {activeTab === 'upload' && (
        <>
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                handleFileProcess(e.target.files[0]);
              }
            }}
            accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
            className="hidden"
          />

          {!hasImage ? (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 select-none ${
                isDragging
                  ? 'border-brand-500 bg-brand-50/30 scale-[1.01]'
                  : 'border-slate-200 bg-slate-50/60 hover:bg-slate-50 hover:border-brand-400'
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center shadow-2xs">
                {isUploading ? (
                  <RefreshCw size={20} className="animate-spin text-brand-600" />
                ) : (
                  <Upload size={20} />
                )}
              </div>

              <div>
                <p className="font-bold text-slate-800 text-xs">
                  {isDragging
                    ? 'Thả ảnh vào đây ngay...'
                    : 'Bấm để chọn ảnh từ máy tính hoặc kéo thả vào đây'}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  PNG, JPG, WEBP (Tối đa 15MB) • Hỗ trợ dán trực tiếp <kbd className="px-1.5 py-0.5 bg-slate-200 text-slate-700 rounded font-mono text-[10px]">Ctrl+V</kbd>
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl p-3 flex items-center justify-between gap-3 shadow-2xs animate-fade-in">
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative group w-14 h-14 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 shrink-0">
                  <img
                    src={localPreview || referenceUrl}
                    alt="Ảnh tham chiếu"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLightbox(true)}
                    className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                    title="Xem ảnh phóng to"
                  >
                    <Eye size={16} />
                  </button>
                </div>

                <div className="min-w-0 flex-1 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-slate-900 truncate max-w-[200px]">
                      {fileInfo?.name || 'Ảnh tải từ máy tính'}
                    </span>
                    {isUploading && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-brand-600 font-semibold animate-pulse">
                        <RefreshCw size={10} className="animate-spin" /> Đang tải lên...
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {fileInfo?.size ? `${fileInfo.size} • ` : ''}Ảnh mẫu Image-to-Image
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:text-brand-600 hover:bg-brand-50 border border-slate-200 hover:border-brand-200 transition-all flex items-center gap-1"
                  title="Chọn ảnh khác từ máy tính"
                >
                  <RefreshCw size={12} />
                  <span>Đổi ảnh</span>
                </button>

                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  title="Xóa ảnh này"
                >
                  <X size={15} />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Mode 2: Dán link URL */}
      {activeTab === 'url' && (
        <div className="space-y-2">
          <div className="relative">
            <input
              type="url"
              value={referenceUrl.startsWith('data:') ? '' : referenceUrl}
              onChange={(e) => {
                const val = e.target.value.trim();
                onChange(val);
                setLocalPreview(val || null);
                setFileInfo(val ? { name: 'Ảnh từ URL trực tuyến', size: 'URL ngoài' } : null);
              }}
              placeholder="Dán link ảnh gốc (URL https://...)"
              className="w-full bg-white border border-slate-200 rounded-lg pl-3 pr-8 py-2.5 text-xs text-slate-800 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 shadow-2xs transition-all"
            />
            {referenceUrl && (
              <button
                type="button"
                onClick={handleRemoveImage}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {referenceUrl && !referenceUrl.startsWith('data:') && (
            <div className="flex items-center gap-2.5 bg-white p-2 rounded-lg border border-slate-200 text-xs">
              <img
                src={referenceUrl}
                alt="Preview"
                className="w-10 h-10 rounded object-cover border border-slate-200"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="%23cbd5e1" stroke-width="2"%3E%3Crect width="18" height="18" x="3" y="3" rx="2"/%3E%3Cpath d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/%3E%3C/svg%3E';
                }}
              />
              <div className="flex-1 min-w-0">
                <span className="font-semibold text-slate-800 block truncate text-[11px]">
                  {referenceUrl}
                </span>
                <span className="text-[10px] text-emerald-600 font-bold">
                  ✓ Link hợp lệ
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Lightbox Modal để phóng to ảnh */}
      {showLightbox && localPreview && (
        <div
          onClick={() => setShowLightbox(false)}
          className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in cursor-zoom-out"
        >
          <div className="relative max-w-2xl max-h-[85vh] bg-transparent">
            <img
              src={localPreview}
              alt="Ảnh phóng to"
              className="w-auto h-auto max-w-full max-h-[85vh] rounded-xl shadow-2xl object-contain"
            />
            <button
              onClick={() => setShowLightbox(false)}
              className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-white text-slate-800 flex items-center justify-center shadow-lg hover:bg-slate-100"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
