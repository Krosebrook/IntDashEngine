
// Added missing ChartData import to resolve type error
import { DepartmentConfig, DepartmentCategory, ChartData } from '../types';

export const DEPARTMENTS: DepartmentConfig[] = [
  {
    id: 'infosec',
    name: 'Information Security',
    category: DepartmentCategory.SERVICE_DELIVERY,
    description: 'SOC 2, Compliance, Audit Success & Security Operations',
    kpis: [
      { id: 'audit-success', label: 'SOC 2 Success', value: 95, unit: '%', target: 90, trend: 'up', change: 2.5, status: 'on-track' },
      { id: 'comp-hours', label: 'Compliance Saved', value: 72, unit: 'hrs', target: 60, trend: 'up', change: 12, status: 'on-track' },
      { id: 'incidents', label: 'Security Incidents', value: 2, unit: 'count', target: 0, trend: 'down', change: -1, status: 'at-risk' }
    ]
  },
  {
    id: 'it',
    name: 'Technology/IT',
    category: DepartmentCategory.SERVICE_DELIVERY,
    description: 'Infrastructure, Device Management & IT Support',
    kpis: [
      { id: 'uptime', label: 'Network Uptime', value: 99.98, unit: '%', target: 99.9, trend: 'flat', change: 0, status: 'on-track' },
      { id: 'ticket-res', label: 'Ticket Resolution', value: 18, unit: 'hrs', target: 24, trend: 'up', change: -2, status: 'on-track' },
      { id: 'ai-adoption', label: 'AI Tool Adoption', value: 82, unit: '%', target: 80, trend: 'up', change: 5, status: 'on-track' }
    ]
  },
  {
    id: 'webdev',
    name: 'Web Design/Dev',
    category: DepartmentCategory.SERVICE_DELIVERY,
    description: 'Performance, Accessibility & Delivery Timelines',
    kpis: [
      { id: 'perf', label: 'Core Web Vitals', value: 92, unit: 'score', target: 90, trend: 'up', change: 4, status: 'on-track' },
      { id: 'on-time', label: 'On-Time Delivery', value: 88, unit: '%', target: 85, trend: 'up', change: 3, status: 'on-track' }
    ]
  },
  {
    id: 'branding',
    name: 'Branding & Identity',
    category: DepartmentCategory.SERVICE_DELIVERY,
    description: 'Asset Consistency & Creative Workflows',
    kpis: [
      { id: 'asset-cons', label: 'Asset Consistency', value: 94, unit: '%', target: 90, trend: 'up', change: 2, status: 'on-track' },
      { id: 'cycles', label: 'Approval Cycles', value: 2.4, unit: 'rounds', target: 3, trend: 'down', change: -0.5, status: 'on-track' }
    ]
  },
  {
    id: 'content',
    name: 'Content Strategy',
    category: DepartmentCategory.SERVICE_DELIVERY,
    description: 'SEO performance, Engagement & Output Volume',
    kpis: [
      { id: 'seo', label: 'Page 1 Keywords', value: 124, unit: 'count', target: 100, trend: 'up', change: 15, status: 'on-track' },
      { id: 'output', label: 'Pieces/Month', value: 24, unit: 'count', target: 20, trend: 'flat', change: 0, status: 'on-track' }
    ]
  },
  {
    id: 'marketing',
    name: 'Managed Marketing',
    category: DepartmentCategory.SERVICE_DELIVERY,
    description: 'ROAS, MQLs & Lead Gen Performance',
    kpis: [
      { id: 'roas', label: 'Campaign ROAS', value: 4.8, unit: ':1', target: 4, trend: 'up', change: 0.6, status: 'on-track' },
      { id: 'leads', label: 'New MQLs', value: 156, unit: 'count', target: 150, trend: 'up', change: 12, status: 'on-track' }
    ]
  },
  {
    id: 'ops',
    name: 'Operations',
    category: DepartmentCategory.SERVICE_DELIVERY,
    description: 'Process Maturity & Efficiency Gains',
    kpis: [
      { id: 'sop', label: 'SOP Documentation', value: 100, unit: '%', target: 100, trend: 'flat', change: 0, status: 'on-track' },
      { id: 'savings', label: 'Cost Optimization', value: 18, unit: '%', target: 15, trend: 'up', change: 3, status: 'on-track' }
    ]
  },
  {
    id: 'sales',
    name: 'Sales/BD',
    category: DepartmentCategory.SUPPORT,
    description: 'Pipeline Velocity & Win Rates',
    kpis: [
      { id: 'win-rate', label: 'Win Rate', value: 28, unit: '%', target: 25, trend: 'up', change: 2, status: 'on-track' },
      { id: 'velocity', label: 'Sales Cycle', value: 42, unit: 'days', target: 45, trend: 'down', change: -3, status: 'on-track' }
    ]
  },
  {
    id: 'cs',
    name: 'Customer Success',
    category: DepartmentCategory.SUPPORT,
    description: 'Retention, NPS & Account Health',
    kpis: [
      { id: 'retention', label: 'Client Retention', value: 97, unit: '%', target: 95, trend: 'up', change: 1, status: 'on-track' },
      { id: 'nps', label: 'NPS Score', value: 64, unit: 'score', target: 50, trend: 'up', change: 8, status: 'on-track' }
    ]
  },
  {
    id: 'finance',
    name: 'Finance',
    category: DepartmentCategory.SUPPORT,
    description: 'AR/AP, Cash Flow & Financial Close',
    kpis: [
      { id: 'dso', label: 'AR Collection (DSO)', value: 28, unit: 'days', target: 30, trend: 'down', change: -2, status: 'on-track' },
      { id: 'burn', label: 'Monthly Burn', value: 120, unit: '$k', target: 150, trend: 'down', change: -10, status: 'on-track' }
    ]
  },
  {
    id: 'hr',
    name: 'HR/Talent',
    category: DepartmentCategory.SUPPORT,
    description: 'Employee Retention & Time to Hire',
    kpis: [
      { id: 'e-retention', label: 'Staff Retention', value: 94, unit: '%', target: 90, trend: 'flat', change: 0, status: 'on-track' },
      { id: 'hire-time', label: 'Time to Hire', value: 34, unit: 'days', target: 30, trend: 'up', change: 4, status: 'at-risk' }
    ]
  },
  {
    id: 'legal',
    name: 'Legal/Compliance',
    category: DepartmentCategory.SUPPORT,
    description: 'Contract TAT & Risk Management',
    kpis: [
      { id: 'tat', label: 'Contract TAT', value: 36, unit: 'hrs', target: 48, trend: 'down', change: -12, status: 'on-track' },
      { id: 'risk', label: 'Regulatory Score', value: 100, unit: '%', target: 100, trend: 'flat', change: 0, status: 'on-track' }
    ]
  },
  {
    id: 'pm',
    name: 'Project Mgmt',
    category: DepartmentCategory.SUPPORT,
    description: 'Resource Utilization & Velocity',
    kpis: [
      { id: 'util', label: 'Resource Util', value: 82, unit: '%', target: 80, trend: 'up', change: 2, status: 'on-track' },
      { id: 'scope', label: 'Scope Creep', value: 8, unit: '%', target: 10, trend: 'down', change: -2, status: 'on-track' }
    ]
  },
  {
    id: 'executive',
    name: 'Executive Leadership',
    category: DepartmentCategory.EXECUTIVE,
    description: 'Global North Star Metrics & Aggregated Growth',
    kpis: [
      { id: 'revenue', label: 'Global Revenue', value: 8.4, unit: '$M', target: 8.0, trend: 'up', change: 12, status: 'on-track' },
      { id: 'profit', label: 'EBITDA Margin', value: 28, unit: '%', target: 25, trend: 'up', change: 3, status: 'on-track' },
      { id: 'satisfaction', label: 'Employee Sat', value: 4.4, unit: '/5', target: 4.0, trend: 'up', change: 0.2, status: 'on-track' }
    ]
  }
];

export const MOCK_CHART_DATA: Record<string, ChartData[]> = {
  performance: [
    { name: 'Mon', value: 65 },
    { name: 'Tue', value: 78 },
    { name: 'Wed', value: 82 },
    { name: 'Thu', value: 74 },
    { name: 'Fri', value: 91 },
    { name: 'Sat', value: 88 },
    { name: 'Sun', value: 95 }
  ],
  revenue: [
    { name: 'Jan', value: 400, target: 450 },
    { name: 'Feb', value: 300, target: 450 },
    { name: 'Mar', value: 600, target: 450 },
    { name: 'Apr', value: 800, target: 450 },
    { name: 'May', value: 500, target: 450 },
    { name: 'Jun', value: 900, target: 450 }
  ]
};
