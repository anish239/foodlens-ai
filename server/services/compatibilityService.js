import {
  COMPATIBILITY_VERSION,
  ALLERGEN_ALIASES,
  RESTRICTION_MAP,
  ANIMAL_MEAT_TERMS,
  FISH_SHELLFISH_TERMS,
  DAIRY_EGG_TERMS,
  matchesTermList,
  normalizeAllergenString,
} from '../utils/compatibilityRules.js';
import { ApiError } from '../utils/ApiError.js';

export const calculateCompatibility = (product, preferences = {}) => {
  if (!product || typeof product !== 'object') {
    throw new ApiError(400, 'Invalid product object for compatibility calculation');
  }

  const prefs = preferences || {};
  const diet = (prefs.diet || 'non-vegetarian').toLowerCase();
  const allergies = Array.isArray(prefs.allergies) ? prefs.allergies.map(a => a.toLowerCase()) : [];
  const restrictions = Array.isArray(prefs.restrictions) ? prefs.restrictions.map(r => r.toLowerCase()) : [];
  const healthGoals = Array.isArray(prefs.healthGoals) ? prefs.healthGoals.map(h => h.toLowerCase()) : [];

  const reasons = [];
  const warnings = [];
  const positiveMatches = [];

  const productAllergens = Array.isArray(product.allergens) ? product.allergens.map(normalizeAllergenString) : [];
  const productTraces = Array.isArray(product.traces) ? product.traces.map(normalizeAllergenString) : [];
  const ingredientText = product.ingredients && product.ingredients.text ? product.ingredients.text.toLowerCase() : '';
  const nutrition = product.nutrition || {};

  const allergenDataAvailable = productAllergens.length > 0;
  const ingredientDataAvailable = ingredientText.length > 0;
  const nutritionDataAvailable = nutrition.sugars !== undefined || nutrition.proteins !== undefined;

  let status = 'compatible';
  let severity = 'low';

  const addConflict = (type, preference, matchedValue, message, sev = 'high') => {
    reasons.push({ type, preference, matchedValue, message });
    if (sev === 'high') {
      status = 'not_compatible';
      severity = 'high';
    } else if (sev === 'medium' && status !== 'not_compatible') {
      status = 'caution';
      severity = 'medium';
    }
  };

  const addWarning = (message, sev = 'medium') => {
    warnings.push({ message, severity: sev });
    if (status === 'compatible') {
      status = 'caution';
      severity = sev;
    }
  };

  const addPositive = (message) => {
    positiveMatches.push({ message });
  };

  // 1. Check Allergies
  for (const allergy of allergies) {
    const aliases = ALLERGEN_ALIASES[allergy] || [allergy];
    let foundDirect = false;
    let foundTrace = false;

    // Check explicit product allergens
    for (const prodAlg of productAllergens) {
      if (aliases.some(alias => prodAlg.includes(alias))) {
        foundDirect = true;
        break;
      }
    }

    // Check ingredient text
    if (!foundDirect && ingredientDataAvailable) {
      if (aliases.some(alias => matchesTermList(ingredientText, [alias]))) {
        foundDirect = true;
      }
    }

    // Check traces
    if (!foundDirect) {
      for (const prodTrace of productTraces) {
        if (aliases.some(alias => prodTrace.includes(alias))) {
          foundTrace = true;
          break;
        }
      }
    }

    if (foundDirect) {
      addConflict('allergen', allergy, allergy, `Product contains confirmed ${allergy} allergen or ingredient.`, 'high');
    } else if (foundTrace) {
      addWarning(`Product indicates possible traces of ${allergy}.`, 'medium');
    } else if (!allergenDataAvailable && !ingredientDataAvailable) {
      addWarning(`Allergen information is unavailable for ${allergy}. Review product packaging before consuming.`, 'medium');
    }
  }

  // 2. Check Restrictions
  for (const restriction of restrictions) {
    const targetAllergens = RESTRICTION_MAP[restriction] || [];
    let restrictedFound = false;

    for (const targetAlg of targetAllergens) {
      const aliases = ALLERGEN_ALIASES[targetAlg] || [targetAlg];
      for (const prodAlg of productAllergens) {
        if (aliases.some(alias => prodAlg.includes(alias))) {
          restrictedFound = true;
          break;
        }
      }
      if (!restrictedFound && ingredientDataAvailable) {
        if (aliases.some(alias => matchesTermList(ingredientText, [alias]))) {
          restrictedFound = true;
        }
      }
    }

    if (restrictedFound) {
      addConflict('restriction', restriction, restriction, `Product conflicts with your ${restriction} restriction.`, 'high');
    }
  }

  // 3. Check Diet
  if (status !== 'not_compatible') {
    if (diet === 'vegetarian') {
      const hasMeat = ANIMAL_MEAT_TERMS.some(term => matchesTermList(ingredientText, [term])) ||
                      FISH_SHELLFISH_TERMS.some(term => matchesTermList(ingredientText, [term]));
      if (hasMeat) {
        addConflict('diet', 'vegetarian', 'meat/fish', 'Product contains animal flesh or fish, which conflicts with a vegetarian diet.', 'high');
      } else {
        addPositive('Aligns with vegetarian diet');
      }
    } else if (diet === 'vegan') {
      const hasAnimal = ANIMAL_MEAT_TERMS.some(term => matchesTermList(ingredientText, [term])) ||
                        FISH_SHELLFISH_TERMS.some(term => matchesTermList(ingredientText, [term])) ||
                        DAIRY_EGG_TERMS.some(term => matchesTermList(ingredientText, [term]));
      if (hasAnimal) {
        addConflict('diet', 'vegan', 'animal-derived', 'Product contains animal-derived ingredients, which conflicts with a vegan diet.', 'high');
      } else {
        addPositive('Aligns with vegan diet');
      }
    } else if (diet === 'eggetarian') {
      const hasMeatOrFish = ANIMAL_MEAT_TERMS.some(term => matchesTermList(ingredientText, [term])) ||
                            FISH_SHELLFISH_TERMS.some(term => matchesTermList(ingredientText, [term]));
      if (hasMeatOrFish) {
        addConflict('diet', 'eggetarian', 'meat/fish', 'Product contains meat or fish, which conflicts with an eggetarian diet.', 'high');
      } else {
        addPositive('Aligns with eggetarian diet');
      }
    } else if (diet === 'pescatarian') {
      const hasTerrestrialMeat = ANIMAL_MEAT_TERMS.some(term => matchesTermList(ingredientText, [term]));
      if (hasTerrestrialMeat) {
        addConflict('diet', 'pescatarian', 'terrestrial meat', 'Product contains terrestrial meat, which conflicts with a pescatarian diet.', 'high');
      } else {
        addPositive('Aligns with pescatarian diet');
      }
    } else if (diet === 'non-vegetarian') {
      addPositive('Compatible with non-vegetarian diet');
    }
  }

  // 4. Check Health Goals (Informational warnings, do not make product incompatible)
  if (nutritionDataAvailable) {
    const sugars = nutrition.sugars ?? null;
    const sodium = nutrition.sodium ?? null;
    const protein = nutrition.proteins ?? null;
    const fiber = nutrition.fiber ?? null;

    if (healthGoals.includes('low-sugar') && sugars !== null && sugars > 15) {
      addWarning(`High sugar content (${sugars}g per 100g) relative to your low-sugar goal.`, 'low');
    }
    if (healthGoals.includes('low-sodium') && sodium !== null && sodium > 0.60) {
      addWarning(`High sodium content (${sodium}g per 100g) relative to your low-sodium goal.`, 'low');
    }
    if (healthGoals.includes('high-protein') && protein !== null && protein >= 10) {
      addPositive(`High protein content (${protein}g per 100g) aligns with your high-protein goal.`);
    }
    if (healthGoals.includes('high-fiber') && fiber !== null && fiber >= 5) {
      addPositive(`High fiber content (${fiber}g per 100g) aligns with your high-fiber goal.`);
    }
  }

  let label = 'Compatible';
  if (status === 'not_compatible') {
    label = 'Not Compatible';
  } else if (status === 'caution') {
    label = 'Check Carefully';
  }

  return {
    status,
    label,
    severity,
    version: COMPATIBILITY_VERSION,
    reasons,
    warnings,
    positiveMatches,
    checkedAgainst: {
      diet,
      allergies,
      restrictions,
      healthGoals,
    },
    dataQuality: {
      allergenDataAvailable,
      ingredientDataAvailable,
      nutritionDataAvailable,
    },
  };
};
