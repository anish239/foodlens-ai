import { fetchProductByBarcode, searchProductsFromAPI, saveManualProductData } from '../services/productService.js';
import { compareProductsList } from '../services/comparisonService.js';
import { calculateFoodLensScore } from '../services/scoreService.js';
import { calculateCompatibility } from '../services/compatibilityService.js';
import { generateProductInsight } from '../services/geminiService.js';
import { getUserProfile } from '../services/userService.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const searchProducts = asyncHandler(async (req, res) => {
  const { q, page = 1, pageSize = 20 } = req.query;
  const results = await searchProductsFromAPI(q, page, pageSize);

  res.status(200).json({
    success: true,
    message: 'Product search completed successfully',
    data: results,
  });
});

export const compareProducts = asyncHandler(async (req, res) => {
  const { barcodes } = req.query;
  const userId = req.user.id;

  const user = await getUserProfile(userId);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  const comparison = await compareProductsList({
    barcodes,
    userPreferences: user.preferences || {},
  });

  res.status(200).json({
    success: true,
    message: 'Product comparison completed successfully',
    data: comparison,
  });
});

export const lookupProductByBarcode = asyncHandler(async (req, res) => {
  const { barcode } = req.params;
  const product = await fetchProductByBarcode(barcode);

  res.status(200).json({
    success: true,
    message: product.isPartial ? 'Product found (partial information available)' : 'Product found',
    data: {
      product,
      isPartial: Boolean(product.isPartial),
      status: product.status || (product.isPartial ? 'partial' : 'complete'),
      sources: product.sources || {},
    },
  });
});

export const submitManualProduct = asyncHandler(async (req, res) => {
  const {
    barcode,
    name,
    brand,
    image,
    quantity,
    servingSize,
    categories,
    ingredientsText,
    allergens,
    traces,
    nutrition,
  } = req.body;

  if (!barcode) {
    throw new ApiError(400, 'Barcode is required for manual product entry', { errorType: 'INVALID_BARCODE' });
  }

  if (!name || typeof name !== 'string' || !name.trim()) {
    throw new ApiError(400, 'Product name is required for manual product entry');
  }

  const product = saveManualProductData({
    barcode,
    name,
    brand,
    image,
    quantity,
    servingSize,
    categories,
    ingredientsText,
    allergens,
    traces,
    nutrition: nutrition || {},
  });

  const userId = req.user?.id;
  let compatibility = null;
  if (userId) {
    const user = await getUserProfile(userId);
    if (user) {
      compatibility = calculateCompatibility(product, user.preferences || {});
    }
  }

  const score = calculateFoodLensScore(product);

  res.status(200).json({
    success: true,
    message: 'Manual product evaluated successfully',
    data: {
      product,
      score,
      compatibility,
    },
  });
});

export const getProductScoreByBarcode = asyncHandler(async (req, res) => {
  const { barcode } = req.params;
  const product = await fetchProductByBarcode(barcode);
  const score = calculateFoodLensScore(product);

  res.status(200).json({
    success: true,
    message: 'Product score calculated successfully',
    data: {
      product,
      score,
    },
  });
});

export const getProductCompatibilityByBarcode = asyncHandler(async (req, res) => {
  const { barcode } = req.params;
  const userId = req.user.id;

  const user = await getUserProfile(userId);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  const product = await fetchProductByBarcode(barcode);
  const compatibility = calculateCompatibility(product, user.preferences);

  res.status(200).json({
    success: true,
    message: 'Product compatibility evaluated successfully',
    data: {
      product,
      compatibility,
    },
  });
});

export const getProductInsight = asyncHandler(async (req, res) => {
  const { barcode } = req.params;
  const userId = req.user.id;

  const user = await getUserProfile(userId);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  const product = await fetchProductByBarcode(barcode);
  const score = calculateFoodLensScore(product);
  const compatibility = calculateCompatibility(product, user.preferences);

  const insight = await generateProductInsight({
    product,
    foodLensScore: score,
    compatibility,
    userId,
  });

  res.status(200).json({
    success: true,
    message: 'AI product insight generated successfully',
    data: {
      product,
      score,
      compatibility,
      insight,
    },
  });
});
