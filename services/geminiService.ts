
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { AIInsight, DepartmentConfig, DepartmentCategory } from "../types";
import { db } from "../lib/db";

// Always use process.env.API_KEY directly for initialization as per guidelines
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Create a deterministic hash of the department state
const generateHash = (dept: DepartmentConfig): string => {
  const coreData = dept.kpis.map(k => `${k.id}:${k.value}:${k.target}`).join('|');
  return `${dept.id}-${coreData}`;
};

export async function getAIInsights(dept: DepartmentConfig): Promise<AIInsight[]> {
  // Defensive check for empty data
  if (!dept || !dept.kpis || dept.kpis.length === 0) {
    return getDefaultInsights(dept);
  }

  // 1. Check Cache
  const hash = generateHash(dept);
  const cached = await db.getInsight(hash);
  if (cached) {
    console.log(`[AI Cache Hit] Returning cached insights for ${dept.name}`);
    return cached;
  }

  const prompt = `
    As an expert business analyst, analyze the current performance of the ${dept.name} department at INT Inc.
    Current KPIs: ${dept.kpis.map(k => `${k.label}: ${k.value}${k.unit} (Target: ${k.target}${k.unit})`).join(', ')}.
    
    Provide 3 strategic insights for this department. 
    Focus on efficiency gains, risk mitigation, and growth opportunities.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
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
    
    const insights = JSON.parse(text);
    
    // 2. Save to Cache
    await db.saveInsight(hash, insights);
    
    return insights;
  } catch (error) {
    console.error("Gemini Error:", error);
    return getDefaultInsights(dept);
  }
}

export async function generateDashboardFromInput(inputText: string): Promise<DepartmentConfig | null> {
  const prompt = `
    Analyze the following unstructured document text and extract a structured Dashboard Configuration for a corporate department.
    
    DOCUMENT TEXT:
    "${inputText.substring(0, 30000)}" 
    
    REQUIREMENTS:
    1. Infer the Department Name and Category (Service Delivery, Support, or Executive).
    2. Extract up to 6 Key Performance Indicators (KPIs).
    3. For each KPI, infer a current value, a unit (%, $, #, etc), a target value, and a status based on the context.
    4. Return a JSON object matching the DepartmentConfig structure.
  `;

  const kpiSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      id: { type: Type.STRING },
      label: { type: Type.STRING },
      description: { type: Type.STRING },
      value: { type: Type.NUMBER },
      unit: { type: Type.STRING },
      target: { type: Type.NUMBER },
      trend: { type: Type.STRING, enum: ['up', 'down', 'flat'] },
      change: { type: Type.NUMBER },
      status: { type: Type.STRING, enum: ['on-track', 'at-risk', 'critical'] }
    },
    required: ['id', 'label', 'value', 'unit', 'target', 'status']
  };

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash", // Using 2.5 Flash for fast document processing
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            name: { type: Type.STRING },
            category: { type: Type.STRING, enum: Object.values(DepartmentCategory) },
            description: { type: Type.STRING },
            kpis: {
              type: Type.ARRAY,
              items: kpiSchema
            }
          },
          required: ['id', 'name', 'category', 'kpis']
        }
      }
    });

    const text = response.text;
    if (!text) return null;
    return JSON.parse(text);
  } catch (error) {
    console.error("Dashboard Generation Error:", error);
    throw new Error("Failed to generate dashboard from document.");
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
