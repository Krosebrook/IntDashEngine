
import { GoogleGenAI, Type } from "@google/genai";
import { AIInsight, DepartmentConfig, KPIRecommendation, KPI } from "../types";

// Simulated Server-Side Cache
const serverCache = new Map<string, { data: any, expiry: number }>();
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour

export async function handleInsightsRequest(dept: DepartmentConfig): Promise<AIInsight[]> {
  const cacheKey = `insights-${dept.id}-${JSON.stringify(dept.kpis)}`;
  const cached = serverCache.get(cacheKey);
  
  if (cached && cached.expiry > Date.now()) {
    return cached.data;
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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
              priority: { type: Type.STRING },
              impact: { type: Type.STRING }
            },
            required: ['title', 'description', 'priority', 'impact']
          }
        }
      }
    });

    const insights = JSON.parse(response.text || "[]");
    serverCache.set(cacheKey, { data: insights, expiry: Date.now() + CACHE_DURATION });
    return insights;
  } catch (error) {
    console.error("[Server Proxy] Gemini Error:", error);
    throw error;
  }
}

export async function handleKPIRecommendationRequest(payload: { kpi: KPI, departmentName: string }): Promise<KPIRecommendation[]> {
  const { kpi, departmentName } = payload;
  const cacheKey = `recs-${kpi.id}-${departmentName}`;
  const cached = serverCache.get(cacheKey);
  
  if (cached && cached.expiry > Date.now()) {
    return cached.data;
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const prompt = `
    As an industry expert in ${departmentName}, analyze the existing KPI "${kpi.label}" (Current: ${kpi.value}${kpi.unit}).
    Recommend 2 additional, complementary metrics that this department should track to improve holistic visibility.
    Metrics should be modern, industry-standard, and technically measurable.
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
              label: { type: Type.STRING, description: "Name of the suggested KPI" },
              description: { type: Type.STRING, description: "What this metric measures" },
              reasoning: { type: Type.STRING, description: "Why this complements the existing metric" },
              suggestedTarget: { type: Type.NUMBER, description: "A realistic industry benchmark target" },
              unit: { type: Type.STRING, description: "Unit of measurement (%, $, etc)" }
            },
            required: ['label', 'description', 'reasoning', 'suggestedTarget', 'unit']
          }
        }
      }
    });

    const recommendations = JSON.parse(response.text || "[]");
    serverCache.set(cacheKey, { data: recommendations, expiry: Date.now() + CACHE_DURATION });
    return recommendations;
  } catch (error) {
    console.error("[Server Proxy] Recommendation Error:", error);
    throw error;
  }
}

export async function handleGenerationRequest(inputText: string): Promise<DepartmentConfig> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const prompt = `
    Analyze the following unstructured document text and extract a structured Dashboard Configuration for a corporate department.
    DOCUMENT TEXT: "${inputText.substring(0, 30000)}" 
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            name: { type: Type.STRING },
            category: { type: Type.STRING },
            description: { type: Type.STRING },
            kpis: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  label: { type: Type.STRING },
                  description: { type: Type.STRING },
                  value: { type: Type.NUMBER },
                  unit: { type: Type.STRING },
                  target: { type: Type.NUMBER },
                  trend: { type: Type.STRING },
                  change: { type: Type.NUMBER },
                  status: { type: Type.STRING }
                },
                required: ['id', 'label', 'value', 'unit', 'target', 'status']
              }
            }
          },
          required: ['id', 'name', 'category', 'kpis']
        }
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("[Server Proxy] Generation Error:", error);
    throw error;
  }
}
