import React from 'react';
import { Card } from '../../../core/components/Card/Card';
import { MoreHorizontal } from 'lucide-react';
import type { ActivityItem } from '../types';
import '../pages/dashboard.css';

interface RecentActivityListProps {
  activities: ActivityItem[];
}

export const RecentActivityList: React.FC<RecentActivityListProps> = ({ activities }) => {
  return (
    <Card className="mf-bottom-card">
      <div className="mf-card-top-row">
        <div>
          <h3 className="mf-card-title">Hoạt động gần đây</h3>
          <p className="mf-card-subtitle">Sự kiện mới nhất từ hệ thống API</p>
        </div>
      </div>

      <div className="mf-activities-list">
        {activities.map((act) => (
          <div key={act.id} className="mf-activity-row">
            <div className="mf-activity-badge">API</div>
            <div className="mf-activity-details">
              <div className="mf-activity-primary">
                <span className="mf-activity-user">{act.user_name}</span>
                <span className="mf-activity-dash">-</span>
                <span className="mf-activity-model">{act.model_name}</span>
                <span className="mf-activity-dash">-</span>
                <span className="mf-activity-status">{act.status}</span>
              </div>
              <div className="mf-activity-meta">
                <span className="mf-activity-cost">{act.cost}</span>
                <span className="mf-activity-meta-sep">-</span>
                <span className="mf-activity-time">{act.timestamp}</span>
              </div>
            </div>
            <button className="mf-icon-btn-subtle" title="Chi tiết">
              <MoreHorizontal size={15} />
            </button>
          </div>
        ))}
      </div>
    </Card>
  );
};
