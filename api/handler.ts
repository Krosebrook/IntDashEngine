
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

  // System instruction handles the persona, keeping the prompt focused on data
  const systemInstruction = `You are an expert business analyst for INT Inc. 
  Your goal is to provide 3 brief, high-impact strategic insights based on department KPIs.
  Focus on efficiency gains, risk mitigation, and growth opportunities.`;

  const prompt = `
    Analyze the ${dept.name} department.
    Current KPIs: ${dept.kpis.map(k => `${k.label}: ${k.value}${k.unit} (Target: ${k.target}${k.unit})`).join(', ')}.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        thinkingConfig: { thinkingBudget: 1024 }, // Enable thinking for better analysis
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

export async function handleKPIRecommendationRequest(payload: { kpi: KPI, departmentName: string, departmentDescription?: string }): Promise<KPIRecommendation[]> {
  const { kpi, departmentName, departmentDescription } = payload;
  const cacheKey = `recs-${kpi.id}-${departmentName}-${departmentDescription || ''}`;
  const cached = serverCache.get(cacheKey);
  
  if (cached && cached.expiry > Date.now()) {
    return cached.data;
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const systemInstruction = `You are a KPI strategy consultant specializing in ${departmentName}.
  Your goal is to recommend modern, industry-standard metrics that complement existing tracking.`;

  const prompt = `
    Analyze the existing KPI: "${kpi.label}" (Value: ${kpi.value}${kpi.unit}).
    ${departmentDescription ? `Context - Department Goals: "${departmentDescription}".` : ''}
    
    Recommend 2 additional, complementary metrics that this department should track to improve holistic visibility.
    The recommendations should:
    1. Align with the specific department goals mentioned above.
    2. Reflect current industry trends and best practices.
    3. Be modern and technically measurable.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        thinkingConfig: { thinkingBudget: 1024 },
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              label: { type: Type.STRING, description: "Name of the suggested KPI" },
              description: { type: Type.STRING, description: "What this metric measures" },
              reasoning: { type: Type.STRING, description: "How this aligns with goals and industry trends" },
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

  const systemInstruction = `You are a Data Engineer. Your task is to parse unstructured business documents 
  and extract a structured Dashboard Configuration object for the INT Inc dashboard engine.
  Ensure data is realistic and correctly typed.`;

  const prompt = `
    DOCUMENT CONTENT: 
    "${inputText.substring(0, 30000)}"
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview", // Using Pro for complex extraction
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        thinkingConfig: { thinkingBudget: 4096 }, // Higher thinking budget for complex extraction
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
