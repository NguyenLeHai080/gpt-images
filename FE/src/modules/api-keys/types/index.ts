export interface ApiKeyItem {
  id: string;
  name: string;
  key_prefix: string;
  status: 'active' | 'inactive' | 'expired';
  created_at: string;
  last_used: string;
  rate_limit: string;
  user_id?: string;
  raw_key?: string;
}

