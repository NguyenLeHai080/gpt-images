import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export const DemoSwitcher: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;

  const btnClass = (active: boolean) =>
    `px-2.5 py-1 rounded-full text-[11px] font-semibold transition-colors ${
      active ? 'bg-orange-500 text-white' : 'bg-white/10 text-slate-300 hover:bg-white/20'
    }`;

  return (
    <div className="fixed bottom-4 right-4 z-[9999] hidden sm:flex items-center gap-1.5 bg-slate-900/90 backdrop-blur px-3 py-1.5 rounded-full border border-white/15 shadow-2xl text-xs font-semibold text-slate-100">
      <span className="text-orange-500 mr-1">✨ URL:</span>
      <button onClick={() => navigate('/app/overview')} className={btnClass(currentPath === '/app/overview')}>
        /app/overview
      </button>
      <button onClick={() => navigate('/auth/login')} className={btnClass(currentPath === '/auth/login')}>
        /auth/login
      </button>
      <button onClick={() => navigate('/404')} className={btnClass(currentPath === '/404')}>
        404
      </button>
      <button onClick={() => navigate('/403')} className={btnClass(currentPath === '/403')}>
        403
      </button>
      <button onClick={() => navigate('/500')} className={btnClass(currentPath === '/500')}>
        500
      </button>
    </div>
  );
};