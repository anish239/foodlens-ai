import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { analyzeFoodImage } from '../services/geminiService.js';

export const analyzeImageHandler = asyncHandler(async (req, res) => {
  const { image, mimeType, type = 'image' } = req.body;

  if (!image || typeof image !== 'string') {
    throw new ApiError(400, 'Image data is required. Provide a valid base64 image or data URL.');
  }

  // Allowed mime types: JPEG, PNG, WEBP
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
  let cleanMimeType = (mimeType || 'image/jpeg').toLowerCase();
  if (cleanMimeType === 'image/jpg') cleanMimeType = 'image/jpeg';

  // Handle data URL prefix if present
  let base64Data = image;
  const dataUrlMatch = image.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
  if (dataUrlMatch) {
    cleanMimeType = dataUrlMatch[1].toLowerCase();
    if (cleanMimeType === 'image/jpg') cleanMimeType = 'image/jpeg';
    base64Data = dataUrlMatch[2];
  }

  if (!allowedMimeTypes.includes(cleanMimeType)) {
    throw new ApiError(400, 'Unsupported image format. Allowed formats: JPEG, PNG, WEBP.');
  }

  // Enforce reasonable payload size constraint (max ~15MB base64 string ~ 10MB file)
  if (base64Data.length > 15 * 1024 * 1024) {
    throw new ApiError(400, 'Image payload exceeds maximum allowed size (10MB).');
  }

  const userPreferences = req.user?.preferences || {};
  const userId = req.user?.id || 'anonymous';

  const analysis = await analyzeFoodImage({
    imageBase64: base64Data,
    mimeType: cleanMimeType,
    analysisType: type,
    userPreferences,
    userId,
  });

  res.status(200).json({
    success: true,
    message: 'Food image analyzed successfully',
    data: {
      analysis,
    },
  });
});
