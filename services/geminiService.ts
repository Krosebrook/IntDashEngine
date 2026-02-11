
import { AIInsight, DepartmentConfig, KPIRecommendation, KPI } from "../types";
import { db } from "../lib/db";
import { apiClient } from "./apiClient";

/**
 * Refactored to use the apiClient.
 * This service communicates with our simulated /api/ backend via the apiClient
 * which avoids global window.fetch monkey-patching.
 */

const generateHash = (dept: DepartmentConfig): string => {
  const coreData = dept.kpis.map(k => `${k.id}:${k.value}:${k.target}`).join('|');
  return `${dept.id}-${coreData}`;
};

export async function getAIInsights(dept: DepartmentConfig): Promise<AIInsight[]> {
  if (!dept || !dept.kpis || dept.kpis.length === 0) {
    return getDefaultInsights(dept);
  }

  // L1 Cache: Browser (IndexedDB)
  const hash = generateHash(dept);
  const cached = await db.getInsight(hash);
  if (cached) {
    return cached;
  }

  try {
    const response = await apiClient.post('/api/insights', dept);
    if (!response.ok) throw new Error('Proxy error');
    const insights = await response.json();
    await db.saveInsight(hash, insights);
    return insights;
  } catch (error) {
    console.error("AI Proxy Request Failed:", error);
    return getDefaultInsights(dept);
  }
}

export async function getKPIRecommendations(kpi: KPI, departmentName: string, departmentDescription?: string): Promise<KPIRecommendation[]> {
  try {
    const response = await apiClient.post('/api/recommend-kpis', { kpi, departmentName, departmentDescription });
    if (!response.ok) throw new Error('Recommendation proxy error');
    return await response.json();
  } catch (error) {
    console.error("KPI Recommendation Failed:", error);
    return [];
  }
}

export async function generateDashboardFromInput(inputText: string): Promise<DepartmentConfig | null> {
  try {
    const response = await apiClient.post('/api/generate-dashboard', { text: inputText });
    if (!response.ok) throw new Error('Generation Proxy error');
    return await response.json();
  } catch (error) {
    console.error("Dashboard Generation Proxy Failed:", error);
    return null;
  }
}

function getDefaultInsights(dept: DepartmentConfig): AIInsight[] {
  const deptName = dept?.name || "Department";
  const primaryKpi = dept?.kpis?.[0];

  return [
    {
      title: "Efficiency Optimization",
      description: `Targeting automated workflows for ${deptName} to reduce manual oversight.`,
      priority: 'medium',
      impact: "15% reduction in cycle time"
    },
    {
      title: "Risk Mitigation",
      description: primaryKpi 
        ? `Historical data suggests seasonal fluctuations in ${primaryKpi.label}.`
        : `Monitor key performance indicators for stability.`,
      priority: 'high',
      impact: "Prevention of SLA breaches"
    },
    {
      title: "Upsell Opportunity",
      description: `Current performance maturity indicates readiness for higher-tier service expansion.`,
      priority: 'low',
      impact: "Increase in average account value"
    }
  ];
}
