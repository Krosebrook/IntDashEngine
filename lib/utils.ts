
/**
 * Safely parses a number from various string formats (e.g., "$1,200", "95%", "1.2k").
 * Returns the parsed number or the fallback if parsing fails.
 */
export const safeParseFloat = (value: string | number, fallback: number = 0): number => {
  if (typeof value === 'number') return value;
  if (!value) return fallback;

  // Remove commas, currency symbols, and percentage signs
  const cleanStr = value.toString().replace(/[$,%]/g, '');
  const parsed = parseFloat(cleanStr);
  
  return isNaN(parsed) ? fallback : parsed;
};

/**
 * Generates a pseudo-random number based on a seed string.
 * This ensures charts look the same every time for the same KPI, rather than changing on render.
 */
const seededRandom = (seed: string) => {
  let h = 0xdeadbeef;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 2654435761);
  }
  return ((h ^ h >>> 16) >>> 0) / 4294967296;
};

/**
 * Generates stable history data for charts based on the KPI ID and current value.
 */
export const generateStableHistoryData = (id: string, currentValue: number | string, target: number, days: number = 30) => {
  const baseValue = safeParseFloat(currentValue, target);
  const data = [];
  
  // Create a predictable variance pattern based on the ID
  const seed = id;
  
  for (let i = 0; i < days; i++) {
    const daySeed = `${seed}-${i}`;
    const random = seededRandom(daySeed);
    // variance between -10% and +10% adjusted by random noise
    const noise = (random * 0.2 - 0.1) * baseValue; 
    
    data.push({
      name: `Day ${i + 1}`,
      value: Math.max(0, parseFloat((baseValue + noise).toFixed(2))),
      target: target
    });
  }
  return data;
};
