import React from 'react';
import { Card } from '../../../core/components/Card/Card';
import { MoreHorizontal } from 'lucide-react';
import type { ApiKeyStatus } from '../types';
import '../styles/dashboard.scss';

interface ApiKeyGaugeProps {
  status: ApiKeyStatus;
}

export const ApiKeyGauge: React.FC<ApiKeyGaugeProps> = ({ status }) => {
  return (
    <Card className="mf-gauge-card">
      {/* Top Header */}
      <div className="mf-card-top-row">
        <div>
          <h3 className="mf-card-title">Trạng thái API key</h3>
          <p className="mf-card-subtitle">{status.total_managed} key đang quản lý</p>
        </div>
        <button className="mf-icon-btn-subtle" title="Tùy chọn">
          <MoreHorizontal size={18} />
        </button>
      </div>

      {/* Semicircular Gauge SVG */}
      <div className="mf-gauge-visual-container">
        <svg viewBox="0 0 200 120" className="mf-gauge-svg">
          {/* Background Track Arc */}
          <path
            d="M 25 105 A 75 75 0 0 1 175 105"
            fill="none"
            stroke="#F1F5F9"
            strokeWidth="16"
            strokeLinecap="round"
          />

          {/* Active Status Arc (Green 100%) */}
          <path
            d="M 25 105 A 75 75 0 0 1 175 105"
            fill="none"
            stroke="#10B981"
            strokeWidth="16"
            strokeLinecap="round"
            strokeDasharray="235.6"
            strokeDashoffset="0"
            className="mf-gauge-progress"
          />
        </svg>

        {/* Center Numbers */}
        <div className="mf-gauge-center-content">
          <span className="mf-gauge-number">{status.total_managed}</span>
          <span className="mf-gauge-label">API key</span>
        </div>
      </div>

      {/* Legend List */}
      <div className="mf-gauge-legend">
        <div className="mf-gauge-legend-item">
          <div className="mf-legend-left">
            <span className="mf-legend-dot mf-legend-dot--green" />
            <span className="mf-legend-name">Đang hoạt động</span>
          </div>
          <span className="mf-legend-count">{status.active_keys}</span>
        </div>

        <div className="mf-gauge-legend-item">
          <div className="mf-legend-left">
            <span className="mf-legend-dot mf-legend-dot--gray" />
            <span className="mf-legend-name">Khác</span>
          </div>
          <span className="mf-legend-count">{status.other_keys}</span>
        </div>
      </div>
    </Card>
  );
};
