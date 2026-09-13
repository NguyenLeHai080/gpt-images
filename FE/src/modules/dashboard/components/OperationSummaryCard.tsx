import React from 'react';
import { Card } from '../../../core/components/Card/Card';
import type { OperationSummary } from '../types';
import '../pages/dashboard.css';

interface OperationSummaryCardProps {
  summary: OperationSummary;
}

export const OperationSummaryCard: React.FC<OperationSummaryCardProps> = ({ summary }) => {
  return (
    <Card className="mf-bottom-card">
      <div className="mf-card-top-row">
        <div>
          <h3 className="mf-card-title">Tóm tắt vận hành</h3>
          <p className="mf-card-subtitle">Dữ liệu hiện tại của hệ thống</p>
        </div>
      </div>

      <div className="mf-summary-content">
        <div className="mf-summary-row">
          <div className="mf-summary-badge mf-summary-badge--api">API</div>
          <div className="mf-summary-info">
            <span className="mf-summary-val">{summary.active_keys} key đang hoạt động</span>
            <span className="mf-summary-sub">{summary.synced_keys} key đã đồng bộ</span>
          </div>
        </div>

        <div className="mf-summary-row">
          <div className="mf-summary-badge mf-summary-badge--ok">OK</div>
          <div className="mf-summary-info">
            <span className="mf-summary-val">{summary.successful_requests.toLocaleString()} request thành công</span>
            <span className="mf-summary-sub">Hệ thống hoạt động ổn định ({summary.uptime})</span>
          </div>
        </div>
      </div>
    </Card>
  );
};
