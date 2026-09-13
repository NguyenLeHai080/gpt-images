import React from 'react';
import { RefreshCw, FileText } from 'lucide-react';
import { useDashboardData } from '../hooks/useDashboardData';
import { MetricCard } from '../components/MetricCard';
import { ApiCostChart } from '../components/ApiCostChart';
import { ApiKeyGauge } from '../components/ApiKeyGauge';
import { RecentActivityList } from '../components/RecentActivityList';
import { OperationSummaryCard } from '../components/OperationSummaryCard';
import { ModelDistributionCard } from '../components/ModelDistributionCard';
import './dashboard.css';

export const DashboardPage: React.FC = () => {
  const { data, isRefreshing, refresh } = useDashboardData();

  return (
    <div className="mf-dashboard-page animate-fade-in">
      {/* Page Header */}
      <div className="mf-page-header">
        <div className="mf-page-title-group">
          <span className="mf-page-date">{data.date_display}</span>
          <h1 className="mf-page-title">
            Tổng quan hệ thống <span className="mf-wave-emoji">👋</span>
          </h1>
          <p className="mf-page-subtitle">
            Dữ liệu tài chính và vận hành API theo thời gian thực.
          </p>
        </div>

        {/* Page Top Actions */}
        <div className="mf-page-actions">
          <button
            className={`mf-btn-refresh-outline ${isRefreshing ? 'mf-spinning' : ''}`}
            onClick={refresh}
          >
            <RefreshCw size={14} />
            <span>Làm mới</span>
          </button>
          <button className="mf-btn-view-usage">
            <FileText size={15} />
            <span>Xem sử dụng</span>
          </button>
        </div>
      </div>

      {/* 4 Metric Summary Cards */}
      <div className="mf-metrics-grid">
        {data.metrics.map((metric) => (
          <MetricCard key={metric.id} metric={metric} />
        ))}
      </div>

      {/* Middle Section: Cost & Request Chart + API Key Gauge */}
      <div className="mf-middle-grid">
        <div className="mf-chart-col">
          <ApiCostChart data={data.chart_data} />
        </div>
        <div className="mf-gauge-col">
          <ApiKeyGauge status={data.key_status} />
        </div>
      </div>

      {/* Bottom Section: 3 Information Cards */}
      <div className="mf-bottom-grid">
        <RecentActivityList activities={data.recent_activities} />
        <OperationSummaryCard summary={data.operation_summary} />
        <ModelDistributionCard
          models={data.model_distribution}
          onRefresh={refresh}
          isRefreshing={isRefreshing}
        />
      </div>
    </div>
  );
};
