
// Added missing ChartData import to resolve type error
import { DepartmentConfig, DepartmentCategory, ChartData } from '../types';

export const DEPARTMENTS: DepartmentConfig[] = [
  {
    id: 'infosec',
    name: 'Information Security',
    category: DepartmentCategory.SERVICE_DELIVERY,
    description: 'SOC 2, Compliance, Audit Success & Security Operations',
    kpis: [
      { id: 'audit-success', label: 'SOC 2 Success', description: 'Percentage of controls passing external SOC 2 audit requirements.', value: 95, unit: '%', target: 90, trend: 'up', change: 2.5, status: 'on-track' },
      { id: 'comp-hours', label: 'Compliance Saved', description: 'Man-hours saved through automated compliance monitoring tools.', value: 72, unit: 'hrs', target: 60, trend: 'up', change: 12, status: 'on-track' },
      { id: 'incidents', label: 'Security Incidents', description: 'Count of confirmed security incidents requiring intervention.', value: 2, unit: 'count', target: 0, trend: 'down', change: -1, status: 'at-risk' }
    ]
  },
  {
    id: 'it',
    name: 'Technology/IT',
    category: DepartmentCategory.SERVICE_DELIVERY,
    description: 'Infrastructure, Device Management & IT Support',
    kpis: [
      { id: 'uptime', label: 'Network Uptime', description: 'Global network availability percentage excluding maintenance.', value: 99.98, unit: '%', target: 99.9, trend: 'flat', change: 0, status: 'on-track' },
      { id: 'ticket-res', label: 'Ticket Resolution', description: 'Average time to resolve L1/L2 support tickets.', value: 18, unit: 'hrs', target: 24, trend: 'up', change: -2, status: 'on-track' },
      { id: 'ai-adoption', label: 'AI Tool Adoption', description: 'Percentage of workforce actively using approved AI tools.', value: 82, unit: '%', target: 80, trend: 'up', change: 5, status: 'on-track' }
    ]
  },
  {
    id: 'webdev',
    name: 'Web Design/Dev',
    category: DepartmentCategory.SERVICE_DELIVERY,
    description: 'Performance, Accessibility & Delivery Timelines',
    kpis: [
      { id: 'perf', label: 'Core Web Vitals', description: 'Aggregate score of LCP, FID, and CLS metrics across properties.', value: 92, unit: 'score', target: 90, trend: 'up', change: 4, status: 'on-track' },
      { id: 'on-time', label: 'On-Time Delivery', description: 'Percentage of project milestones delivered by due date.', value: 88, unit: '%', target: 85, trend: 'up', change: 3, status: 'on-track' }
    ]
  },
  {
    id: 'branding',
    name: 'Branding & Identity',
    category: DepartmentCategory.SERVICE_DELIVERY,
    description: 'Asset Consistency & Creative Workflows',
    kpis: [
      { id: 'asset-cons', label: 'Asset Consistency', description: 'Brand audit score for cross-channel visual consistency.', value: 94, unit: '%', target: 90, trend: 'up', change: 2, status: 'on-track' },
      { id: 'cycles', label: 'Approval Cycles', description: 'Average rounds of revision before final asset approval.', value: 2.4, unit: 'rounds', target: 3, trend: 'down', change: -0.5, status: 'on-track' }
    ]
  },
  {
    id: 'content',
    name: 'Content Strategy',
    category: DepartmentCategory.SERVICE_DELIVERY,
    description: 'SEO performance, Engagement & Output Volume',
    kpis: [
      { id: 'seo', label: 'Page 1 Keywords', description: 'Number of non-branded keywords ranking on Google Page 1.', value: 124, unit: 'count', target: 100, trend: 'up', change: 15, status: 'on-track' },
      { id: 'output', label: 'Pieces/Month', description: 'Total published content pieces across all channels.', value: 24, unit: 'count', target: 20, trend: 'flat', change: 0, status: 'on-track' }
    ]
  },
  {
    id: 'marketing',
    name: 'Managed Marketing',
    category: DepartmentCategory.SERVICE_DELIVERY,
    description: 'ROAS, MQLs & Lead Gen Performance',
    kpis: [
      { id: 'roas', label: 'Campaign ROAS', description: 'Return on Ad Spend calculated across paid media.', value: 4.8, unit: ':1', target: 4, trend: 'up', change: 0.6, status: 'on-track' },
      { id: 'leads', label: 'New MQLs', description: 'Marketing Qualified Leads generated this month.', value: 156, unit: 'count', target: 150, trend: 'up', change: 12, status: 'on-track' }
    ]
  },
  {
    id: 'ops',
    name: 'Operations',
    category: DepartmentCategory.SERVICE_DELIVERY,
    description: 'Process Maturity & Efficiency Gains',
    kpis: [
      { id: 'sop', label: 'SOP Documentation', description: 'Percentage of core processes with up-to-date documentation.', value: 100, unit: '%', target: 100, trend: 'flat', change: 0, status: 'on-track' },
      { id: 'savings', label: 'Cost Optimization', description: 'Operational expense reduction through efficiency.', value: 18, unit: '%', target: 15, trend: 'up', change: 3, status: 'on-track' }
    ]
  },
  {
    id: 'sales',
    name: 'Sales/BD',
    category: DepartmentCategory.SUPPORT,
    description: 'Pipeline Velocity & Win Rates',
    kpis: [
      { id: 'win-rate', label: 'Win Rate', description: 'Percentage of opportunities closed-won.', value: 28, unit: '%', target: 25, trend: 'up', change: 2, status: 'on-track' },
      { id: 'velocity', label: 'Sales Cycle', description: 'Average days from opportunity creation to closed-won.', value: 42, unit: 'days', target: 45, trend: 'down', change: -3, status: 'on-track' }
    ]
  },
  {
    id: 'cs',
    name: 'Customer Success',
    category: DepartmentCategory.SUPPORT,
    description: 'Retention, NPS & Account Health',
    kpis: [
      { id: 'retention', label: 'Client Retention', description: 'Percentage of clients retained over the rolling 12 months.', value: 97, unit: '%', target: 95, trend: 'up', change: 1, status: 'on-track' },
      { id: 'nps', label: 'NPS Score', description: 'Net Promoter Score based on recent client surveys.', value: 64, unit: 'score', target: 50, trend: 'up', change: 8, status: 'on-track' }
    ]
  },
  {
    id: 'finance',
    name: 'Finance',
    category: DepartmentCategory.SUPPORT,
    description: 'AR/AP, Cash Flow & Financial Close',
    kpis: [
      { id: 'dso', label: 'AR Collection (DSO)', description: 'Days Sales Outstanding average.', value: 28, unit: 'days', target: 30, trend: 'down', change: -2, status: 'on-track' },
      { id: 'burn', label: 'Monthly Burn', description: 'Net cash burn rate for the current month.', value: 120, unit: '$k', target: 150, trend: 'down', change: -10, status: 'on-track' }
    ]
  },
  {
    id: 'hr',
    name: 'HR/Talent',
    category: DepartmentCategory.SUPPORT,
    description: 'Employee Retention & Time to Hire',
    kpis: [
      { id: 'e-retention', label: 'Staff Retention', description: 'Annualized employee retention rate.', value: 94, unit: '%', target: 90, trend: 'flat', change: 0, status: 'on-track' },
      { id: 'hire-time', label: 'Time to Hire', description: 'Average days to fill an open position.', value: 34, unit: 'days', target: 30, trend: 'up', change: 4, status: 'at-risk' }
    ]
  },
  {
    id: 'legal',
    name: 'Legal/Compliance',
    category: DepartmentCategory.SUPPORT,
    description: 'Contract TAT & Risk Management',
    kpis: [
      { id: 'tat', label: 'Contract TAT', description: 'Turnaround time for standard contract review.', value: 36, unit: 'hrs', target: 48, trend: 'down', change: -12, status: 'on-track' },
      { id: 'risk', label: 'Regulatory Score', description: 'Internal score for regulatory compliance health.', value: 100, unit: '%', target: 100, trend: 'flat', change: 0, status: 'on-track' }
    ]
  },
  {
    id: 'pm',
    name: 'Project Mgmt',
    category: DepartmentCategory.SUPPORT,
    description: 'Resource Utilization & Velocity',
    kpis: [
      { id: 'util', label: 'Resource Util', description: 'Billable utilization rate across delivery teams.', value: 82, unit: '%', target: 80, trend: 'up', change: 2, status: 'on-track' },
      { id: 'scope', label: 'Scope Creep', description: 'Percentage of projects exceeding original scope by >10%.', value: 8, unit: '%', target: 10, trend: 'down', change: -2, status: 'on-track' }
    ]
  },
  {
    id: 'executive',
    name: 'Executive Leadership',
    category: DepartmentCategory.EXECUTIVE,
    description: 'Global North Star Metrics & Aggregated Growth',
    kpis: [
      { id: 'revenue', label: 'Global Revenue', description: 'Total recognized revenue across all business lines.', value: 8.4, unit: '$M', target: 8.0, trend: 'up', change: 12, status: 'on-track' },
      { id: 'profit', label: 'EBITDA Margin', description: 'Earnings Before Interest, Taxes, Depreciation, and Amortization.', value: 28, unit: '%', target: 25, trend: 'up', change: 3, status: 'on-track' },
      { id: 'satisfaction', label: 'Employee Sat', description: 'Average score from quarterly engagement surveys.', value: 4.4, unit: '/5', target: 4.0, trend: 'up', change: 0.2, status: 'on-track' }
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
