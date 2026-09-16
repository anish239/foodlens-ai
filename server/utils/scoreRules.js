export const SCORE_VERSION = '1.0';

export const calculateSugarImpact = (sugar) => {
  if (sugar === null || sugar === undefined || isNaN(sugar)) return null;
  const val = Number(sugar);
  if (val < 0) return { impact: 0, reason: 'Invalid negative value ignored' };
  if (val <= 5) return { impact: 0, reason: 'Low sugar content' };
  if (val <= 10) return { impact: -3, reason: 'Moderate sugar content' };
  if (val <= 20) return { impact: -6, reason: 'Elevated sugar content' };
  if (val <= 30) return { impact: -10, reason: 'High sugar content' };
  return { impact: -15, reason: 'Very high sugar content' };
};

export const calculateSaturatedFatImpact = (satFat) => {
  if (satFat === null || satFat === undefined || isNaN(satFat)) return null;
  const val = Number(satFat);
  if (val < 0) return { impact: 0, reason: 'Invalid negative value ignored' };
  if (val <= 1.5) return { impact: 0, reason: 'Low saturated fat content' };
  if (val <= 3) return { impact: -3, reason: 'Moderate saturated fat content' };
  if (val <= 5) return { impact: -6, reason: 'Elevated saturated fat content' };
  if (val <= 7.5) return { impact: -10, reason: 'High saturated fat content' };
  return { impact: -15, reason: 'Very high saturated fat content' };
};

export const calculateSodiumImpact = (sodium, salt) => {
  let effectiveSodium = sodium;
  let unitUsed = 'g/100g';

  if ((effectiveSodium === null || effectiveSodium === undefined || isNaN(effectiveSodium)) && salt !== null && salt !== undefined && !isNaN(salt)) {
    // Convert salt to sodium (sodium ≈ salt / 2.5)
    effectiveSodium = Number(salt) / 2.5;
  }

  if (effectiveSodium === null || effectiveSodium === undefined || isNaN(effectiveSodium)) return null;
  const val = Number(effectiveSodium);
  if (val < 0) return { impact: 0, reason: 'Invalid negative value ignored' };
  if (val <= 0.12) return { impact: 0, reason: 'Low sodium content' };
  if (val <= 0.30) return { impact: -3, reason: 'Moderate sodium content' };
  if (val <= 0.60) return { impact: -6, reason: 'Elevated sodium content' };
  if (val <= 1.00) return { impact: -10, reason: 'High sodium content' };
  return { impact: -15, reason: 'Very high sodium content' };
};

export const calculateFiberImpact = (fiber) => {
  if (fiber === null || fiber === undefined || isNaN(fiber)) return null;
  const val = Number(fiber);
  if (val < 0) return { impact: 0, reason: 'Invalid negative value ignored' };
  if (val >= 5) return { impact: 5, reason: 'Excellent fiber content' };
  if (val >= 3) return { impact: 3, reason: 'Good fiber content' };
  if (val >= 1.5) return { impact: 1, reason: 'Moderate fiber content' };
  return { impact: 0, reason: 'Low fiber content' };
};

export const calculateProteinImpact = (protein) => {
  if (protein === null || protein === undefined || isNaN(protein)) return null;
  const val = Number(protein);
  if (val < 0) return { impact: 0, reason: 'Invalid negative value ignored' };
  if (val >= 10) return { impact: 5, reason: 'High protein content' };
  if (val >= 7) return { impact: 3, reason: 'Good protein content' };
  if (val >= 4) return { impact: 1, reason: 'Moderate protein content' };
  return { impact: 0, reason: 'Low protein content' };
};

export const calculateNovaImpact = (novaGroup) => {
  if (novaGroup === null || novaGroup === undefined || isNaN(novaGroup)) return null;
  const val = Number(novaGroup);
  switch (val) {
    case 1:
      return { impact: 3, reason: 'Minimally processed classification (NOVA 1)' };
    case 2:
      return { impact: 2, reason: 'Processed culinary ingredient (NOVA 2)' };
    case 3:
      return { impact: 0, reason: 'Processed food classification (NOVA 3)' };
    case 4:
      return { impact: -8, reason: 'Ultra-processed food classification (NOVA 4)' };
    default:
      return null;
  }
};

export const calculateNutriscoreImpact = (nutriscore) => {
  if (!nutriscore || typeof nutriscore !== 'string') return null;
  const grade = nutriscore.trim().toUpperCase();
  switch (grade) {
    case 'A':
      return { impact: 3, reason: 'Nutri-Score Grade A' };
    case 'B':
      return { impact: 2, reason: 'Nutri-Score Grade B' };
    case 'C':
      return { impact: 0, reason: 'Nutri-Score Grade C' };
    case 'D':
      return { impact: -2, reason: 'Nutri-Score Grade D' };
    case 'E':
      return { impact: -3, reason: 'Nutri-Score Grade E' };
    default:
      return null;
  }
};

export const getGradeAndLabel = (score) => {
  if (score >= 90) {
    return { grade: 'Excellent', label: 'Excellent choice' };
  } else if (score >= 75) {
    return { grade: 'Good', label: 'Good choice' };
  } else if (score >= 60) {
    return { grade: 'Fair', label: 'Moderate choice' };
  } else if (score >= 40) {
    return { grade: 'Poor', label: 'Consider alternatives' };
  } else {
    return { grade: 'Very Poor', label: 'Consider alternatives' };
  }
};
