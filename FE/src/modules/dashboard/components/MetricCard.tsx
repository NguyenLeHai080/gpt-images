import React from 'react';
import { Wallet, TrendingUp, Receipt, Activity } from 'lucide-react';
import { Card } from '../../../core/components/Card/Card';
import type { MetricItem } from '../types';
import '../pages/dashboard.css';

interface MetricCardProps {
  metric: MetricItem;
}

export const MetricCard: React.FC<MetricCardProps> = ({ metric }) => {
  const renderIcon = () => {
    switch (metric.icon) {
      case 'wallet':
        return <Wallet size={20} className="mf-metric-icon-svg" />;
      case 'trending-up':
        return <TrendingUp size={20} className="mf-metric-icon-svg" />;
      case 'receipt':
        return <Receipt size={20} className="mf-metric-icon-svg" />;
      case 'activity':
      default:
        return <Activity size={20} className="mf-metric-icon-svg" />;
    }
  };

  return (
    <Card className="mf-metric-card" hoverable>
      <div className="mf-metric-header">
        <div className={`mf-metric-icon-box mf-metric-icon-box--${metric.icon}`}>
          {renderIcon()}
        </div>
        <span className="mf-metric-title">{metric.title}</span>
      </div>

      <div className="mf-metric-value-container">
        <span className="mf-metric-value">{metric.value}</span>
      </div>

      <div className="mf-metric-footer">
        <span className={`mf-metric-badge mf-metric-badge--${metric.badge_type}`}>
          {metric.badge_text}
        </span>
      </div>
    </Card>
  );
};
