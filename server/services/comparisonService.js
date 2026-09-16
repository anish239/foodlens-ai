import { normalizeBarcode, validateBarcode, fetchProductByBarcode } from './productService.js';
import { calculateFoodLensScore } from './scoreService.js';
import { calculateCompatibility } from './compatibilityService.js';
import { ApiError } from '../utils/ApiError.js';

export const parseAndValidateBarcodes = (rawBarcodes) => {
  if (!rawBarcodes) {
    throw new ApiError(400, 'Comparison requires between 2 and 4 product barcodes');
  }

  let list = [];
  if (Array.isArray(rawBarcodes)) {
    list = rawBarcodes.map(s => String(s).trim()).filter(Boolean);
  } else if (typeof rawBarcodes === 'string') {
    list = rawBarcodes.split(',').map(s => s.trim()).filter(Boolean);
  } else {
    throw new ApiError(400, 'Invalid barcodes parameter format');
  }

  if (list.length < 2 || list.length > 4) {
    throw new ApiError(400, 'Comparison requires between 2 and 4 product barcodes');
  }

  const normalized = list.map(normalizeBarcode);
  const uniqueSet = new Set(normalized);

  if (uniqueSet.size !== normalized.length) {
    throw new ApiError(400, 'Duplicate barcodes provided for comparison');
  }

  for (const barcode of normalized) {
    if (!validateBarcode(barcode)) {
      throw new ApiError(400, `Invalid barcode format in comparison list: ${barcode}`);
    }
  }

  return normalized;
};

export const compareProductsList = async ({ barcodes, userPreferences = {} }) => {
  const normalizedBarcodes = parseAndValidateBarcodes(barcodes);

  const comparedItems = await Promise.all(
    normalizedBarcodes.map(async (barcode) => {
      const product = await fetchProductByBarcode(barcode);
      const score = calculateFoodLensScore(product);
      const compatibility = calculateCompatibility(product, userPreferences);

      return {
        product,
        score,
        compatibility,
      };
    })
  );

  return {
    products: comparedItems,
    comparisonCount: comparedItems.length,
  };
};
