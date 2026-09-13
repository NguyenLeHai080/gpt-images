import type { ReactNode } from 'react';

export type ErrorCode = '404' | '403' | '500' | '503' | 'network' | 'empty' | 'custom';

export interface ErrorPreset {
  badge: string;
  title: string;
  description: string;
  defaultActionText: string;
}

export interface ErrorStateProps {
  code?: ErrorCode;
  title?: string;
  description?: string;
  extra?: ReactNode;
  actionText?: string;
  onAction?: () => void;
  showBackButton?: boolean;
  showHomeButton?: boolean;
  compact?: boolean;
  className?: string;
}