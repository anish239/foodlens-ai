/**
 * FoodLens AI - Backend Barcode Validation & Normalization Utility
 * Supports retail GTINs: UPC-A (12), EAN-13 (13), EAN-8 (8), and ITF-14 (14).
 * Preserves leading zeroes and validates GS1 Modulo-10 check digits.
 */

/**
 * Normalizes barcode input by trimming whitespace and removing spaces and hyphens.
 * CRITICAL: Never converts to a Number, preserving all leading zeroes.
 *
 * @param {string|number} rawBarcode
 * @returns {string} Clean numeric barcode string
 */
export const normalizeBarcode = (rawBarcode) => {
  if (rawBarcode == null) return '';
  return String(rawBarcode).trim().replace(/[\s-]/g, '');
};

/**
 * Calculates GS1 standard Modulo-10 check digit for a given payload string.
 * Moving right-to-left from the last payload digit, weights alternate 3, 1, 3, 1...
 *
 * @param {string} payloadDigits - Barcode string excluding the check digit
 * @returns {number|null} Expected check digit (0-9) or null if invalid payload
 */
export const calculateGtinCheckDigit = (payloadDigits) => {
  if (!payloadDigits || typeof payloadDigits !== 'string' || !/^\d+$/.test(payloadDigits)) {
    return null;
  }

  let sum = 0;
  let weight = 3;

  for (let i = payloadDigits.length - 1; i >= 0; i--) {
    sum += parseInt(payloadDigits[i], 10) * weight;
    weight = weight === 3 ? 1 : 3;
  }

  return (10 - (sum % 10)) % 10;
};

/**
 * Validates check digit of standard retail barcodes (EAN-13, UPC-A, EAN-8, ITF-14).
 *
 * @param {string} barcode - Normalized barcode string
 * @returns {boolean} True if checksum is valid or not applicable; false if check digit fails
 */
export const validateGtinChecksum = (barcode) => {
  if (!barcode || !/^\d+$/.test(barcode)) return false;

  const len = barcode.length;

  if (len === 12 || len === 13 || len === 14) {
    const payload = barcode.slice(0, -1);
    const actualCheckDigit = parseInt(barcode.slice(-1), 10);
    const expectedCheckDigit = calculateGtinCheckDigit(payload);
    return expectedCheckDigit === actualCheckDigit;
  }

  if (len === 8) {
    const payload = barcode.slice(0, -1);
    const actualCheckDigit = parseInt(barcode.slice(-1), 10);
    const expectedEan8Check = calculateGtinCheckDigit(payload);
    if (expectedEan8Check === actualCheckDigit) {
      return true;
    }

    const expandedUpcA = expandUpcEToUpcA(barcode);
    if (expandedUpcA) {
      const upcAPayload = expandedUpcA.slice(0, -1);
      const expectedUpcACheck = calculateGtinCheckDigit(upcAPayload);
      return expectedUpcACheck === actualCheckDigit;
    }

    return false;
  }

  return true;
};

/**
 * Expands an 8-digit UPC-E code to a 12-digit UPC-A code for checksum verification.
 *
 * @param {string} upce - 8-digit UPC-E string (starts with 0 or 1)
 * @returns {string|null} 12-digit UPC-A or null if invalid format
 */
export const expandUpcEToUpcA = (upce) => {
  if (!/^[01]\d{7}$/.test(upce)) return null;

  const numberSystem = upce[0];
  const manufacturerAndItem = upce.slice(1, 7);
  const checkDigit = upce[7];
  const lastDigit = manufacturerAndItem[5];

  let middle = '';
  if (['0', '1', '2'].includes(lastDigit)) {
    middle = manufacturerAndItem.slice(0, 2) + lastDigit + '0000' + manufacturerAndItem.slice(2, 5);
  } else if (lastDigit === '3') {
    middle = manufacturerAndItem.slice(0, 3) + '00000' + manufacturerAndItem.slice(3, 5);
  } else if (lastDigit === '4') {
    middle = manufacturerAndItem.slice(0, 4) + '00000' + manufacturerAndItem[4];
  } else {
    middle = manufacturerAndItem.slice(0, 5) + '0000' + lastDigit;
  }

  return `${numberSystem}${middle}${checkDigit}`;
};

/**
 * Identifies the barcode symbology based on normalized length.
 *
 * @param {string} normalizedBarcode
 * @returns {string} Detected format name
 */
export const detectBarcodeFormat = (normalizedBarcode) => {
  const len = normalizedBarcode.length;
  if (len === 8) return 'EAN-8 / UPC-E';
  if (len === 12) return 'UPC-A';
  if (len === 13) return 'EAN-13';
  if (len === 14) return 'ITF-14';
  return 'OTHER';
};

/**
 * Comprehensive barcode verification.
 *
 * @param {string|number} rawInput
 * @param {Object} [options]
 * @param {boolean} [options.requireChecksum=true]
 * @returns {Object} { isValid, normalized, format, error, errorType }
 */
export const verifyBarcode = (rawInput, options = { requireChecksum: true }) => {
  const normalized = normalizeBarcode(rawInput);

  if (!normalized) {
    return {
      isValid: false,
      normalized: '',
      format: null,
      error: 'Please enter a barcode number.',
      errorType: 'EMPTY',
    };
  }

  if (!/^\d+$/.test(normalized)) {
    return {
      isValid: false,
      normalized,
      format: null,
      error: 'Barcode must contain numbers only.',
      errorType: 'CONTAINS_LETTERS',
    };
  }

  const len = normalized.length;
  const validLengths = [8, 12, 13, 14];

  if (!validLengths.includes(len)) {
    return {
      isValid: false,
      normalized,
      format: null,
      error: `Barcode must be 8, 12, or 13 digits (current length: ${len}).`,
      errorType: 'INVALID_LENGTH',
    };
  }

  const format = detectBarcodeFormat(normalized);

  if (options?.requireChecksum !== false) {
    const isChecksumValid = validateGtinChecksum(normalized);
    if (!isChecksumValid) {
      const payload = normalized.slice(0, -1);
      const actualCheckDigit = parseInt(normalized.slice(-1), 10);
      const expectedCheckDigit = calculateGtinCheckDigit(payload);

      return {
        isValid: false,
        normalized,
        format,
        error: 'Barcode read may be incorrect. Checksum verification failed.',
        errorType: 'CHECKSUM_FAILED',
        actualCheckDigit,
        expectedCheckDigit,
      };
    }
  }

  return {
    isValid: true,
    normalized,
    format,
    error: null,
    errorType: null,
  };
};

/**
 * Format & length validation (backwards-compatible with existing productService exports).
 */
export const validateBarcode = (barcode, options = {}) => {
  const normalized = normalizeBarcode(barcode);
  const regex = /^\d+$/;
  if (!regex.test(normalized)) {
    return false;
  }
  if (![8, 12, 13].includes(normalized.length) && normalized.length < 5) {
    if (normalized.length < 8 || normalized.length > 14) {
      return false;
    }
  }

  if (options.requireChecksum) {
    return validateGtinChecksum(normalized);
  }

  return true;
};
