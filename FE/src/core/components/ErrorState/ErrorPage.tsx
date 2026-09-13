import React from 'react';
import { ErrorState } from './ErrorState';
import type { ErrorStateProps } from './ErrorState.types';
import logoSidebar from '../../../assets/img/logo-sidebar.svg';

export const ErrorPage: React.FC<ErrorStateProps> = (props) => {
  return (
    <div className="min-h-screen w-full bg-slate-50/60 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative background grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

      {/* Brand Header */}
      <div className="mb-6 z-10 flex items-center gap-2.5">
        <img src={logoSidebar} alt="MintForge Business Suite" className="h-8 w-auto object-contain" />
      </div>

      {/* Main Error Box */}
      <div className="w-full max-w-xl bg-white border border-slate-200/90 rounded-2xl shadow-xl shadow-slate-200/50 z-10 p-6 sm:p-10 backdrop-blur-sm">
        <ErrorState {...props} />
      </div>

      {/* Footer Info */}
      <div className="mt-8 text-xs text-slate-400 z-10">
        MintForge Platform • Chuẩn bảo mật cấp cao • Enterprise Defense
      </div>
    </div>
  );
};