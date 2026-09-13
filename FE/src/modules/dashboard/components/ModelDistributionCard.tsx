import React from 'react';
import { Card } from '../../../core/components/Card/Card';
import { RefreshCw } from 'lucide-react';
import type { ModelDistributionItem } from '../types';
import '../styles/dashboard.scss';

interface ModelDistributionCardProps {
  models: ModelDistributionItem[];
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export const ModelDistributionCard: React.FC<ModelDistributionCardProps> = ({
  models,
  onRefresh,
  isRefreshing,
}) => {
  return (
    <Card className="mf-bottom-card">
      <div className="mf-card-top-row">
        <div>
          <h3 className="mf-card-title">Phân bổ request theo model</h3>
          <p className="mf-card-subtitle">Dựa trên log API gần nhất</p>
        </div>
        <button
          className={`mf-btn-pill-refresh ${isRefreshing ? 'mf-spinning' : ''}`}
          onClick={onRefresh}
          title="Làm mới phân bổ"
        >
          <RefreshCw size={12} />
          <span>Làm mới</span>
        </button>
      </div>

      <div className="mf-models-list">
        {models.map((m) => (
          <div key={m.model_id} className="mf-model-item">
            <div className="mf-model-left">
              <div className="mf-model-badge">{m.badge}</div>
              <div className="mf-model-name">{m.model_name}</div>
            </div>
            <div className="mf-model-right">
              <span className="mf-model-req-count">{m.request_count} request</span>
            </div>
          </div>
        ))}

        {/* Progress Bar */}
        <div className="mf-model-progress-track">
          <div className="mf-model-progress-fill" style={{ width: '100%' }} />
        </div>
      </div>
    </Card>
  );
};
