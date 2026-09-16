import { UpcitemdbProvider, defaultUpcitemdbProvider } from './upcitemdbProvider.js';

/**
 * Secondary Product Provider (Fallback for barcode lookup when Open Food Facts is missing or incomplete)
 * Backwards-compatible wrapper around UpcitemdbProvider.
 */
export class SecondaryProductProvider extends UpcitemdbProvider {
  constructor(options = {}) {
    super(options);
    this.name = 'secondary';
  }
}

export const defaultSecondaryProductProvider = new SecondaryProductProvider();
export { UpcitemdbProvider, defaultUpcitemdbProvider };
