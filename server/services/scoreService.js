import {
  SCORE_VERSION,
  calculateSugarImpact,
  calculateSaturatedFatImpact,
  calculateSodiumImpact,
  calculateFiberImpact,
  calculateProteinImpact,
  calculateNovaImpact,
  calculateNutriscoreImpact,
  getGradeAndLabel,
} from '../utils/scoreRules.js';
import { ApiError } from '../utils/ApiError.js';

export const calculateFoodLensScore = (product) => {
  if (!product || typeof product !== 'object') {
    throw new ApiError(400, 'Invalid product object for score calculation');
  }

  let baseScore = 100;
  const breakdown = [];

  const nutrition = product.nutrition || {};
  const sugar = nutrition.sugars ?? null;
  const satFat = nutrition.saturatedFat ?? null;
  const sodium = nutrition.sodium ?? null;
  const salt = nutrition.salt ?? null;
  const fiber = nutrition.fiber ?? null;
  const protein = nutrition.proteins ?? null;
  const novaGroup = product.novaGroup ?? null;
  const nutriscore = product.nutriscore ?? null;

  // 1. Sugar impact
  const sugarRes = calculateSugarImpact(sugar);
  if (sugarRes) {
    baseScore += sugarRes.impact;
    breakdown.push({
      factor: 'Sugar',
      value: Number(sugar),
      unit: 'g/100g',
      impact: sugarRes.impact,
      reason: sugarRes.reason,
    });
  }

  // 2. Saturated fat impact
  const satFatRes = calculateSaturatedFatImpact(satFat);
  if (satFatRes) {
    baseScore += satFatRes.impact;
    breakdown.push({
      factor: 'Saturated Fat',
      value: Number(satFat),
      unit: 'g/100g',
      impact: satFatRes.impact,
      reason: satFatRes.reason,
    });
  }

  // 3. Sodium impact
  let effectiveSodium = sodium;
  let sodiumSourceVal = sodium;
  let sodiumUnit = 'g/100g';
  if ((effectiveSodium === null || effectiveSodium === undefined || isNaN(effectiveSodium)) && salt !== null && salt !== undefined && !isNaN(salt)) {
    effectiveSodium = Number(salt) / 2.5;
    sodiumSourceVal = salt;
    sodiumUnit = 'g/100g (derived from salt)';
  }

  const sodiumRes = calculateSodiumImpact(sodium, salt);
  if (sodiumRes) {
    baseScore += sodiumRes.impact;
    breakdown.push({
      factor: 'Sodium',
      value: sodiumSourceVal !== null && !isNaN(sodiumSourceVal) ? Number(sodiumSourceVal) : null,
      unit: sodiumUnit,
      impact: sodiumRes.impact,
      reason: sodiumRes.reason,
    });
  }

  // 4. Fiber bonus
  const fiberRes = calculateFiberImpact(fiber);
  if (fiberRes && fiberRes.impact !== 0) {
    baseScore += fiberRes.impact;
    breakdown.push({
      factor: 'Fiber',
      value: Number(fiber),
      unit: 'g/100g',
      impact: fiberRes.impact,
      reason: fiberRes.reason,
    });
  }

  // 5. Protein bonus
  const proteinRes = calculateProteinImpact(protein);
  if (proteinRes && proteinRes.impact !== 0) {
    baseScore += proteinRes.impact;
    breakdown.push({
      factor: 'Protein',
      value: Number(protein),
      unit: 'g/100g',
      impact: proteinRes.impact,
      reason: proteinRes.reason,
    });
  }

  // 6. NOVA impact
  const novaRes = calculateNovaImpact(novaGroup);
  if (novaRes) {
    baseScore += novaRes.impact;
    breakdown.push({
      factor: 'NOVA',
      value: Number(novaGroup),
      unit: null,
      impact: novaRes.impact,
      reason: novaRes.reason,
    });
  }

  // 7. Nutri-Score impact
  const nutriscoreRes = calculateNutriscoreImpact(nutriscore);
  if (nutriscoreRes) {
    baseScore += nutriscoreRes.impact;
    breakdown.push({
      factor: 'Nutri-Score',
      value: String(nutriscore).toUpperCase(),
      unit: null,
      impact: nutriscoreRes.impact,
      reason: nutriscoreRes.reason,
    });
  }

  // Clamp final score between 0 and 100
  const finalScore = Math.max(0, Math.min(100, Math.round(baseScore)));
  const { grade, label } = getGradeAndLabel(finalScore);

  return {
    score: finalScore,
    grade,
    label,
    version: SCORE_VERSION,
    breakdown,
  };
};
