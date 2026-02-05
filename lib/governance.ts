
export type RiskLevel = 'low' | 'medium' | 'high';
export type PromptDomain = 'CodeGen' | 'Data' | 'Strategy' | 'Writing' | 'Evaluation';

export interface GovernanceProfile {
  risk: RiskLevel;
  domain: PromptDomain;
  complianceFlags: string[];
  recommendedModel: string;
  safetyGatesEnabled: boolean;
}

export const classifyGovernance = (role: string, task: string, env: string): GovernanceProfile => {
  let risk: RiskLevel = 'low';
  let domain: PromptDomain = 'Strategy';
  let complianceFlags: string[] = [];

  // Logic-based classification
  if (task.toLowerCase().includes('code') || task.toLowerCase().includes('agent')) {
    domain = 'CodeGen';
    risk = env === 'Production' ? 'high' : 'medium';
  } else if (task.toLowerCase().includes('analysis') || task.toLowerCase().includes('eval')) {
    domain = 'Data';
    risk = 'medium';
  }

  if (env === 'Production') {
    complianceFlags = ['PII_REDACTION', 'AUDIT_LOGGING', 'COST_LIMIT'];
  }

  return {
    risk,
    domain,
    complianceFlags,
    recommendedModel: risk === 'high' ? 'gemini-3-pro-preview' : 'gemini-3-flash-preview',
    safetyGatesEnabled: true
  };
};

export const validatePromptSafety = (text: string): { safe: boolean; reason?: string } => {
  const piiPatterns = [
    /\b\d{3}-\d{2}-\d{4}\b/, // SSN
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/ // Email
  ];

  for (const pattern of piiPatterns) {
    if (pattern.test(text)) {
      return { safe: false, reason: 'PII detected. Mask sensitive data before execution.' };
    }
  }

  return { safe: true };
};
