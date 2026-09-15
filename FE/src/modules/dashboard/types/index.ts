export interface MetricItem {
  id: string;
  title: string;
  value: string;
  numeric_value: number;
  unit: string;
  badge_text: string;
  badge_type: 'success' | 'warning' | 'info' | 'purple' | 'danger';
  icon: 'wallet' | 'trending-up' | 'receipt' | 'activity';
}

export interface ChartPoint {
  day: string;
  cost: number;
  requests: number;
}

export interface ApiKeyStatus {
  total_managed: number;
  active_keys: number;
  other_keys: number;
}

export interface ActivityItem {
  id: string;
  user_name: string;
  model_name: string;
  status: string;
  cost: string;
  timestamp: string;
}

export interface OperationSummary {
  active_keys: number;
  synced_keys: number;
  successful_requests: number;
  uptime: string;
}

export interface ModelDistributionItem {
  model_id: string;
  model_name: string;
  request_count: number;
  cost_amount: string;
  badge: string;
}

export interface AccountOption {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface DashboardOverviewData {
  date_display: string;
  metrics: MetricItem[];
  chart_data: ChartPoint[];
  key_status: ApiKeyStatus;
  recent_activities: ActivityItem[];
  operation_summary: OperationSummary;
  model_distribution: ModelDistributionItem[];
  scope_type?: 'all' | 'user';
  scope_user_name?: string;
  accounts?: AccountOption[];
  is_exhausted?: boolean;
  available_images?: number;
  user_balance?: number;
  provider_balance?: number;
}
