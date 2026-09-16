/**
 * FoodLens AI - Standard Barcode Utilities (Phase 12)
 * Supports retail GTINs: UPC-A (12), EAN-13 (13), and EAN-8 (8).
 * Preserves leading zeroes and validates GS1 standard Modulo-10 check digits.
 * Never converts barcodes to Number. Never silently alters invalid barcodes.
 */

/**
 * Normalizes barcode input by trimming whitespace and removing spaces and hyphens.
 * CRITICAL: Converts to String safely and NEVER converts to Number, preserving leading zeroes.
 *
 * @param {string|number|null|undefined} rawBarcode
 * @returns {string} Normalized numeric barcode string
 */
export const normalizeBarcode = (rawBarcode) => {
  if (rawBarcode === null || rawBarcode === undefined) return '';
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
 * Determines the barcode symbology type from length.
 *
 * @param {string} barcode
 * @returns {'EAN-8' | 'UPC-A' | 'EAN-13' | 'UNKNOWN'}
 */
export const getBarcodeType = (barcode) => {
  const clean = normalizeBarcode(barcode);
  if (!clean) return 'UNKNOWN';
  if (clean.length === 8) return 'EAN-8';
  if (clean.length === 12) return 'UPC-A';
  if (clean.length === 13) return 'EAN-13';
  return 'UNKNOWN';
};

/**
 * Validates check digit of standard retail barcodes (EAN-8, UPC-A, EAN-13).
 *
 * @param {string} barcode - Normalized barcode string
 * @returns {boolean} True if checksum matches GS1 modulo-10 algorithm
 */
export const validateChecksum = (barcode) => {
  const clean = normalizeBarcode(barcode);
  if (!clean || !/^\d+$/.test(clean)) return false;

  const len = clean.length;
  if (![8, 12, 13].includes(len)) return false;

  const payload = clean.slice(0, -1);
  const actualCheckDigit = parseInt(clean.slice(-1), 10);
  const expectedCheckDigit = calculateGtinCheckDigit(payload);

  return expectedCheckDigit === actualCheckDigit;
};

/**
 * Validates barcode format, length, and checksum without silent mutation.
 * Returns structured validation information.
 *
 * @param {string|number} rawInput
 * @param {Object} [options]
 * @param {boolean} [options.requireChecksum=true]
 * @returns {{
 *   valid: boolean,
 *   normalized: string,
 *   type: string | null,
 *   checksumValid: boolean,
 *   errorCode?: string,
 *   actualCheckDigit?: number,
 *   expectedCheckDigit?: number | null
 * }}
 */
export const validateBarcode = (rawInput, options = { requireChecksum: true }) => {
  const normalized = normalizeBarcode(rawInput);

  if (!normalized) {
    return {
      valid: false,
      normalized: '',
      type: null,
      checksumValid: false,
      errorCode: 'EMPTY',
    };
  }

  if (!/^\d+$/.test(normalized)) {
    return {
      valid: false,
      normalized,
      type: null,
      checksumValid: false,
      errorCode: 'CONTAINS_LETTERS',
    };
  }

  const type = getBarcodeType(normalized);
  if (type === 'UNKNOWN') {
    return {
      valid: false,
      normalized,
      type: 'UNKNOWN',
      checksumValid: false,
      errorCode: 'INVALID_LENGTH',
    };
  }

  if (options?.requireChecksum !== false) {
    const isChecksumValid = validateChecksum(normalized);
    if (!isChecksumValid) {
      const payload = normalized.slice(0, -1);
      const actualCheckDigit = parseInt(normalized.slice(-1), 10);
      const expectedCheckDigit = calculateGtinCheckDigit(payload);
      const suggestedCorrection = expectedCheckDigit !== null ? `${payload}${expectedCheckDigit}` : null;

      return {
        valid: false,
        normalized,
        type,
        checksumValid: false,
        errorCode: 'INVALID_CHECKSUM',
        actualCheckDigit,
        expectedCheckDigit,
        suggestedCorrection,
      };
    }
  }

  return {
    valid: true,
    normalized,
    type,
    checksumValid: true,
  };
};
