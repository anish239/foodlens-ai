import { ApiError } from './ApiError.js';

export const DEFAULT_AI_DISCLAIMER = 'FoodLens AI provides informational food analysis and does not provide medical advice.';

export const validateAndNormalizeAIResponse = (raw) => {
  if (!raw) {
    throw new ApiError(502, 'AI service returned an empty response');
  }

  let data = raw;
  if (typeof raw === 'string') {
    try {
      // Strip markdown backticks if returned
      const cleaned = raw.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
      data = JSON.parse(cleaned);
    } catch (err) {
      throw new ApiError(502, 'AI service returned malformed JSON response');
    }
  }

  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    throw new ApiError(502, 'Invalid AI response structure: expected an object');
  }

  const {
    summary,
    highlights,
    concerns,
    scoreExplanation,
    compatibilityExplanation,
    recommendation,
    disclaimer,
  } = data;

  if (typeof summary !== 'string' || !summary.trim()) {
    throw new ApiError(502, 'AI response missing or invalid "summary" field');
  }

  if (!Array.isArray(highlights)) {
    throw new ApiError(502, 'AI response missing or invalid "highlights" array');
  }

  if (!Array.isArray(concerns)) {
    throw new ApiError(502, 'AI response missing or invalid "concerns" array');
  }

  if (typeof scoreExplanation !== 'string' || !scoreExplanation.trim()) {
    throw new ApiError(502, 'AI response missing or invalid "scoreExplanation" field');
  }

  if (typeof compatibilityExplanation !== 'string' || !compatibilityExplanation.trim()) {
    throw new ApiError(502, 'AI response missing or invalid "compatibilityExplanation" field');
  }

  if (typeof recommendation !== 'string' || !recommendation.trim()) {
    throw new ApiError(502, 'AI response missing or invalid "recommendation" field');
  }

  // Normalize string lengths and array bounds
  const truncate = (str, max) => (str.length > max ? str.slice(0, max - 3) + '...' : str);

  const normalizedSummary = truncate(summary.trim(), 400);
  const normalizedScoreExplanation = truncate(scoreExplanation.trim(), 600);
  const normalizedCompatibilityExplanation = truncate(compatibilityExplanation.trim(), 600);
  const normalizedRecommendation = truncate(recommendation.trim(), 500);

  const normalizedHighlights = highlights
    .filter(item => typeof item === 'string' && item.trim().length > 0)
    .slice(0, 5)
    .map(item => truncate(item.trim(), 150));

  const normalizedConcerns = concerns
    .filter(item => typeof item === 'string' && item.trim().length > 0)
    .slice(0, 5)
    .map(item => truncate(item.trim(), 150));

  const normalizedDisclaimer = typeof disclaimer === 'string' && disclaimer.trim().length > 0
    ? truncate(disclaimer.trim(), 250)
    : DEFAULT_AI_DISCLAIMER;

  return {
    summary: normalizedSummary,
    highlights: normalizedHighlights,
    concerns: normalizedConcerns,
    scoreExplanation: normalizedScoreExplanation,
    compatibilityExplanation: normalizedCompatibilityExplanation,
    recommendation: normalizedRecommendation,
    disclaimer: normalizedDisclaimer,
  };
};

export const validateAndNormalizeImageAnalysisResponse = (raw) => {
  if (!raw) {
    throw new ApiError(502, 'AI image analysis returned an empty response');
  }

  let data = raw;
  if (typeof raw === 'string') {
    try {
      const cleaned = raw.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
      data = JSON.parse(cleaned);
    } catch {
      throw new ApiError(502, 'AI image analysis returned malformed JSON response');
    }
  }

  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    throw new ApiError(502, 'Invalid AI image analysis response structure: expected an object');
  }

  const truncate = (str, max) => (typeof str === 'string' ? (str.length > max ? str.slice(0, max - 3) + '...' : str) : '');

  const productName = truncate(data.productName || 'Identified Food Item', 100);
  const brand = truncate(data.brand || '', 100);
  const category = truncate(data.category || 'Food & Nutrition', 100);
  const summary = truncate(data.summary || 'Nutritional analysis of the submitted food image.', 400);

  const identifiedIngredients = Array.isArray(data.identifiedIngredients)
    ? data.identifiedIngredients
        .filter((item) => typeof item === 'string' && item.trim().length > 0)
        .slice(0, 15)
        .map((item) => truncate(item.trim(), 80))
    : [];

  const detectedAllergens = Array.isArray(data.detectedAllergens)
    ? data.detectedAllergens
        .filter((item) => typeof item === 'string' && item.trim().length > 0)
        .slice(0, 10)
        .map((item) => truncate(item.trim(), 60))
    : [];

  const rawHighlights = Array.isArray(data.highlights) ? data.highlights : [];
  const highlights = rawHighlights
    .filter((item) => typeof item === 'string' && item.trim().length > 0)
    .slice(0, 5)
    .map((item) => truncate(item.trim(), 150));
  if (highlights.length === 0) {
    highlights.push('Visual food composition analyzed');
  }

  const rawConcerns = Array.isArray(data.concerns) ? data.concerns : [];
  const concerns = rawConcerns
    .filter((item) => typeof item === 'string' && item.trim().length > 0)
    .slice(0, 5)
    .map((item) => truncate(item.trim(), 150));

  const parsedScore = Number(data.healthScore);
  const healthScore = !isNaN(parsedScore) && parsedScore >= 1 && parsedScore <= 100
    ? Math.round(parsedScore)
    : 70;

  const recommendation = truncate(data.recommendation || 'Enjoy as part of a balanced diet.', 500);

  const estimatedNutrition = {
    calories: truncate(data.estimatedNutrition?.calories || 'N/A', 40),
    protein: truncate(data.estimatedNutrition?.protein || 'N/A', 40),
    carbs: truncate(data.estimatedNutrition?.carbs || 'N/A', 40),
    fat: truncate(data.estimatedNutrition?.fat || 'N/A', 40),
    sugar: truncate(data.estimatedNutrition?.sugar || 'N/A', 40),
    sodium: truncate(data.estimatedNutrition?.sodium || 'N/A', 40),
  };

  const disclaimer = typeof data.disclaimer === 'string' && data.disclaimer.trim().length > 0
    ? truncate(data.disclaimer.trim(), 250)
    : DEFAULT_AI_DISCLAIMER;

  return {
    productName,
    brand,
    category,
    summary,
    identifiedIngredients,
    detectedAllergens,
    estimatedNutrition,
    highlights,
    concerns,
    healthScore,
    recommendation,
    disclaimer,
  };
};

