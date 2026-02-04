
export enum DepartmentCategory {
  SERVICE_DELIVERY = 'Service Delivery',
  SUPPORT = 'Support',
  EXECUTIVE = 'Executive'
}

export interface KPI {
  id: string;
  label: string;
  value: number | string;
  unit: string;
  target: number;
  trend: 'up' | 'down' | 'flat';
  change: number;
  status: 'on-track' | 'at-risk' | 'critical';
}

export interface ChartData {
  name: string;
  value: number;
  target?: number;
  [key: string]: any;
}

export interface DepartmentConfig {
  id: string;
  name: string;
  category: DepartmentCategory;
  kpis: KPI[];
  description: string;
}

export interface AIInsight {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  impact: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'admin' | 'viewer' | 'editor';
}

export interface FeedbackSubmission {
  id: string;
  userId: string;
  type: 'bug' | 'feature' | 'comment';
  title: string;
  description: string;
  timestamp: number;
}
