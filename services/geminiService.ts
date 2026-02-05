
import { GoogleGenAI, Type } from "@google/genai";
import { AIInsight, DepartmentConfig } from "../types";

// Always use process.env.API_KEY directly for initialization as per guidelines
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function getAIInsights(dept: DepartmentConfig): Promise<AIInsight[]> {
  // Defensive check for empty data
  if (!dept || !dept.kpis || dept.kpis.length === 0) {
    return getDefaultInsights(dept);
  }

  const prompt = `
    As an expert business analyst, analyze the current performance of the ${dept.name} department at INT Inc.
    Current KPIs: ${dept.kpis.map(k => `${k.label}: ${k.value}${k.unit} (Target: ${k.target}${k.unit})`).join(', ')}.
    
    Provide 3 strategic insights for this department. 
    Focus on efficiency gains, risk mitigation, and growth opportunities.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              priority: { type: Type.STRING, enum: ['low', 'medium', 'high', 'critical'] },
              impact: { type: Type.STRING }
            },
            required: ['title', 'description', 'priority', 'impact']
          }
        }
      }
    });

    const text = response.text;
    if (!text) return getDefaultInsights(dept);
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini Error:", error);
    return getDefaultInsights(dept);
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
