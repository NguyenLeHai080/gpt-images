import React, { useState } from 'react';
import { Card } from '../../../core/components/Card/Card';
import { Button } from '../../../core/components/Button/Button';
import { Badge } from '../../../core/components/Badge/Badge';
import { ShieldAlert, CheckCircle2, Sliders } from 'lucide-react';
import { alert } from '../../../core/alert';

export const FailoverSettingsCard: React.FC = () => {
  const [autoFailover, setAutoFailover] = useState(true);
  const [timeoutSec, setTimeoutSec] = useState(45);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      alert.success('Đã lưu cấu hình dự phòng!', 'Cơ chế Failover và Timeout đã được đồng bộ với AI Gateway.');
    }, 400);
  };

  return (
    <Card padding="lg" className="border border-slate-200 bg-gradient-to-br from-white to-slate-50/50">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <ShieldAlert size={18} />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 text-sm">
              Cơ Chế Chuyển Mạch Tự Động & Dự Phòng (Failover Engine)
            </h4>
            <span className="text-[11px] text-slate-500 block">
              Bảo vệ độ sẵn sàng 99.9% cho các yêu cầu sinh ảnh qua API & Studio
            </span>
          </div>
        </div>
        <Badge variant={autoFailover ? 'success' : 'warning'}>
          {autoFailover ? 'Đang bật tự động dự phòng' : 'Chỉ dùng NCC chính'}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        {/* Toggle Failover */}
        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
          <span className="font-bold text-slate-900 block mb-1">
            Tự động chuyển mạch dự phòng
          </span>
          <p className="text-slate-500 text-[11px] mb-3">
            Tự động chuyển sang NCC phụ (Standby) khi NCC chính trả lỗi 5xx hoặc timeout.
          </p>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={autoFailover}
              onChange={(e) => setAutoFailover(e.target.checked)}
              className="w-4 h-4 rounded text-brand-500 focus:ring-brand-400"
            />
            <span className="font-bold text-slate-700">Kích hoạt Failover</span>
          </label>
        </div>

        {/* Timeout */}
        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
          <span className="font-bold text-slate-900 block mb-1">
            Giới hạn Timeout phản hồi
          </span>
          <p className="text-slate-500 text-[11px] mb-2">
            Thời gian tối đa chờ phản hồi ảnh từ NCC trước khi kích hoạt chuyển mạch.
          </p>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={timeoutSec}
              onChange={(e) => setTimeoutSec(Number(e.target.value))}
              min={15}
              max={120}
              className="w-20 px-2 py-1 border border-slate-200 rounded-lg font-mono text-center font-bold text-slate-800"
            />
            <span className="text-slate-500 font-medium">giây</span>
          </div>
        </div>

        {/* Policy Highlights */}
        <div className="bg-brand-50/50 p-3 rounded-xl border border-brand-100 shadow-2xs">
          <span className="font-bold text-brand-900 block mb-1 flex items-center gap-1">
            <CheckCircle2 size={13} className="text-brand-600" />
            Chính sách quyết toán NCC
          </span>
          <ul className="text-[11px] text-brand-800 space-y-1 mt-1.5 list-disc pl-4">
            <li><strong>Chỉ tính tiền khi ảnh thành công</strong> (Fail = 0đ).</li>
            <li><strong>Ảnh tham chiếu (Reference) miễn phí</strong> 100%.</li>
            <li>Tự động rollback 100% ví khách khi lỗi mạng.</li>
          </ul>
        </div>
      </div>

      <div className="flex justify-end mt-4 pt-3 border-t border-slate-100">
        <Button
          size="sm"
          variant="primary"
          onClick={handleSave}
          disabled={isSaving}
          className="font-bold flex items-center gap-1.5"
        >
          <Sliders size={13} />
          {isSaving ? 'Đang lưu...' : 'Lưu Cấu Hình Dự Phòng'}
        </Button>
      </div>
    </Card>
  );
};
