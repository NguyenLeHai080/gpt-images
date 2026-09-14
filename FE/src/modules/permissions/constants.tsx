import React from 'react';
import { Users, KeyRound, Wallet, Sparkles, Settings } from 'lucide-react';

export const MODULE_META: Record<string, { icon: React.ReactNode; bg: string; text: string; border: string }> = {
  accounts: {
    icon: <Users size={17} className="text-brand-600" />,
    bg: 'bg-orange-50',
    text: 'text-brand-700',
    border: 'border-orange-200',
  },
  apikeys: {
    icon: <KeyRound size={17} className="text-sky-600" />,
    bg: 'bg-sky-50',
    text: 'text-sky-700',
    border: 'border-sky-200',
  },
  billing: {
    icon: <Wallet size={17} className="text-emerald-600" />,
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
  },
  ai_studio: {
    icon: <Sparkles size={17} className="text-purple-600" />,
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-200',
  },
  system: {
    icon: <Settings size={17} className="text-slate-600" />,
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-200',
  },
};

export const ROLE_COLOR_MAP: Record<
  string,
  { badge: 'purple' | 'brand' | 'info' | 'success'; headerBg: string; text: string; border: string }
> = {
  SUPER_ADMIN: { badge: 'purple', headerBg: 'bg-purple-50/60', text: 'text-purple-700', border: 'border-purple-200' },
  ADMIN: { badge: 'brand', headerBg: 'bg-orange-50/60', text: 'text-brand-700', border: 'border-orange-200' },
  DEVELOPER: { badge: 'info', headerBg: 'bg-sky-50/60', text: 'text-sky-700', border: 'border-sky-200' },
  MEMBER: { badge: 'success', headerBg: 'bg-emerald-50/60', text: 'text-emerald-700', border: 'border-emerald-200' },
};
