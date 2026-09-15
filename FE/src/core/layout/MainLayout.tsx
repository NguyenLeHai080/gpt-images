import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowRight, ShieldCheck } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { systemApi, type MaintenanceStatus } from '../api/system';

interface MainLayoutProps {
  children: React.ReactNode;
  onNavigateToDocs?: () => void;
}

export const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  onNavigateToDocs,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [maintenance, setMaintenance] = useState<MaintenanceStatus | null>(null);

  const fetchMaintenance = useCallback(async () => {
    try {
      const res = await systemApi.getMaintenance();
      if (res.data) {
        setMaintenance(res.data);
      }
    } catch {
      // Ignore network errors on background poll
    }
  }, []);

  useEffect(() => {
    fetchMaintenance();
    const interval = setInterval(fetchMaintenance, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, [fetchMaintenance]);

  return (
    <div className="mf-main-layout">
      {/* Sidebar (Responsive Drawer on Mobile) */}
      <Sidebar
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />

      {/* Main Area Right */}
      <div className="mf-main-area">
        <Header
          onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
          onNavigateToDocs={onNavigateToDocs}
          maintenanceStatus={maintenance}
          onMaintenanceChange={fetchMaintenance}
        />

        {/* Global Maintenance Alert Banner */}
        {maintenance?.is_maintenance && (
          <div className="bg-gradient-to-r from-amber-600 via-amber-500 to-orange-600 text-white px-4 py-2.5 shadow-md flex items-center justify-between flex-wrap gap-2 text-xs font-semibold z-30 animate-fade-in border-b border-amber-600/30">
            <div className="flex items-center gap-2.5">
              <span className="p-1 rounded-lg bg-black/20 text-white shrink-0 animate-pulse">
                <AlertTriangle size={16} />
              </span>
              <div>
                <span className="font-extrabold uppercase tracking-wide bg-black/20 px-2 py-0.5 rounded mr-2 text-[11px]">
                  CỔNG API ĐANG BẢO TRÌ
                </span>
                <span className="font-medium text-amber-50">
                  {maintenance.message ||
                    'Cổng API đang tạm ngưng nhận lệnh bắn từ bot/tool của khách. Số dư ví được bảo toàn 100% (không trừ tiền).'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="hidden md:inline-flex items-center gap-1 text-[11px] bg-white/20 px-2.5 py-0.5 rounded-full text-amber-50 font-bold">
                <ShieldCheck size={13} className="text-emerald-300" /> Không trừ ví
              </span>
              <Link
                to="/app/api-keys"
                className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-white text-amber-900 font-extrabold hover:bg-amber-50 transition-colors shadow-2xs text-xs shrink-0"
              >
                <span>Xem Mẫu Log API & Hướng Dẫn</span>
                <ArrowRight size={13} />
              </Link>
            </div>
          </div>
        )}

        <main className="mf-content-container">
          {children}
        </main>
      </div>
    </div>
  );
};