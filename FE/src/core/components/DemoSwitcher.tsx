import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export const DemoSwitcher: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isLoginPage = location.pathname.startsWith('/auth');

  return (
    <div className="fixed bottom-4 right-4 z-[9999] hidden sm:flex items-center gap-2 bg-slate-900/90 backdrop-blur px-3 py-1.5 rounded-full border border-white/15 shadow-2xl text-xs font-semibold text-slate-100">
      <span className="text-orange-500">✨ Chuyển URL:</span>
      <button
        onClick={() => navigate('/auth/login')}
        className={`px-2.5 py-1 rounded-full text-[11px] transition-colors ${
          isLoginPage ? 'bg-orange-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'
        }`}
      >
        /auth/login
      </button>
      <button
        onClick={() => navigate('/app/overview')}
        className={`px-2.5 py-1 rounded-full text-[11px] transition-colors ${
          !isLoginPage ? 'bg-orange-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'
        }`}
      >
        /app/overview
      </button>
    </div>
  );
};