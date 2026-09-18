import React, { useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { foodService } from '../../services/foodService';
import { X, Check, AlertCircle, FileText, Activity, Layers, Tag, ShieldAlert } from 'lucide-react';

const COMMON_ALLERGENS = [
  'milk',
  'peanuts',
  'tree nuts',
  'soy',
  'wheat',
  'gluten',
  'eggs',
  'fish',
  'crustaceans',
  'sesame',
  'mustard',
  'celery',
];

export const ManualProductModal = ({ isOpen, onClose, initialBarcode = '', onSuccess }) => {
  const [barcode, setBarcode] = useState(initialBarcode);
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [quantity, setQuantity] = useState('');
  const [servingSize, setServingSize] = useState('');
  const [ingredientsText, setIngredientsText] = useState('');
  const [selectedAllergens, setSelectedAllergens] = useState([]);
  const [customAllergen, setCustomAllergen] = useState('');

  // Nutrition per 100g
  const [energyKcal, setEnergyKcal] = useState('');
  const [proteins, setProteins] = useState('');
  const [carbohydrates, setCarbohydrates] = useState('');
  const [sugars, setSugars] = useState('');
  const [fat, setFat] = useState('');
  const [saturatedFat, setSaturatedFat] = useState('');
  const [fiber, setFiber] = useState('');
  const [sodium, setSodium] = useState('');
  const [salt, setSalt] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Sync barcode if prop changes
  React.useEffect(() => {
    if (initialBarcode) {
      setBarcode(initialBarcode);
    }
  }, [initialBarcode]);

  if (!isOpen) return null;

  const toggleAllergen = (alg) => {
    if (selectedAllergens.includes(alg)) {
      setSelectedAllergens(selectedAllergens.filter((a) => a !== alg));
    } else {
      setSelectedAllergens([...selectedAllergens, alg]);
    }
  };

  const handleAddCustomAllergen = (e) => {
    e.preventDefault();
    if (customAllergen.trim()) {
      const clean = customAllergen.trim().toLowerCase();
      if (!selectedAllergens.includes(clean)) {
        setSelectedAllergens([...selectedAllergens, clean]);
      }
      setCustomAllergen('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Product name is required');
      return;
    }
    if (!barcode.trim()) {
      setError('Barcode is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = {
        barcode: barcode.trim(),
        name: name.trim(),
        brand: brand.trim() || 'Unspecified Brand',
        quantity: quantity.trim() || null,
        servingSize: servingSize.trim() || null,
        ingredientsText: ingredientsText.trim() || null,
        allergens: selectedAllergens,
        nutrition: {
          energyKcal: energyKcal !== '' ? parseFloat(energyKcal) : null,
          proteins: proteins !== '' ? parseFloat(proteins) : null,
          carbohydrates: carbohydrates !== '' ? parseFloat(carbohydrates) : null,
          sugars: sugars !== '' ? parseFloat(sugars) : null,
          fat: fat !== '' ? parseFloat(fat) : null,
          saturatedFat: saturatedFat !== '' ? parseFloat(saturatedFat) : null,
          fiber: fiber !== '' ? parseFloat(fiber) : null,
          sodium: sodium !== '' ? parseFloat(sodium) : null,
          salt: salt !== '' ? parseFloat(salt) : null,
        },
      };

      const res = await foodService.submitManualProduct(payload);
      if (res.success && res.data?.product) {
        if (onSuccess) {
          onSuccess(res.data.product, res.data.score, res.data.compatibility);
        }
        onClose();
      } else {
        setError(res.message || 'Failed to submit product details');
      }
    } catch (err) {
      setError(err.message || 'An error occurred while saving product details');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200/90">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div>
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2 tracking-tight">
              <FileText className="w-5 h-5 text-emerald-600" />
              <span>Enter Product Information</span>
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Add packaging information for unlisted barcode{' '}
              <span className="font-mono font-bold text-slate-800 bg-slate-200/80 px-2 py-0.5 rounded-md">
                {barcode}
              </span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 text-sm">
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
              <span>{typeof error === 'string' ? error : (error?.message || 'Please check form input')}</span>
            </div>
          )}

          <div className="p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-2xl text-xs text-amber-900 flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <p className="font-medium">
              This information will be tagged as <strong>User-Provided</strong>. Missing nutrients remain neutral and will not be artificially guessed.
            </p>
          </div>

          {/* Section 1: Basic Information */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-slate-400" />
              <span>1. Basic Product Details</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Product Name <span className="text-rose-500">*</span>
                </Label>
                <Input
                  type="text"
                  required
                  placeholder="e.g. Kokan Syrup"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="rounded-xl"
                />
              </div>
              <div>
                <Label className="block text-xs font-bold text-slate-700 mb-1.5">Brand Name</Label>
                <Input
                  type="text"
                  placeholder="e.g. Coastal Organics"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  className="rounded-xl"
                />
              </div>
              <div>
                <Label className="block text-xs font-bold text-slate-700 mb-1.5">Quantity / Net Weight</Label>
                <Input
                  type="text"
                  placeholder="e.g. 500 ml or 250 g"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="rounded-xl"
                />
              </div>
              <div>
                <Label className="block text-xs font-bold text-slate-700 mb-1.5">Serving Size</Label>
                <Input
                  type="text"
                  placeholder="e.g. 30 ml (2 tbsp)"
                  value={servingSize}
                  onChange={(e) => setServingSize(e.target.value)}
                  className="rounded-xl"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Ingredients & Allergens */}
          <div className="space-y-4 pt-2 border-t border-slate-100">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-slate-400" />
              <span>2. Ingredients &amp; Known Allergens</span>
            </h4>
            <div>
              <Label className="block text-xs font-bold text-slate-700 mb-1.5">
                Ingredients List (from packaging label)
              </Label>
              <textarea
                rows={2}
                placeholder="e.g. Kokum extract, purified water, cane sugar, cumin, black salt, citric acid"
                value={ingredientsText}
                onChange={(e) => setIngredientsText(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-normal"
              />
            </div>

            <div>
              <Label className="block text-xs font-bold text-slate-700 mb-1.5">
                Select Known Allergens
              </Label>
              <div className="flex flex-wrap gap-1.5 mb-2.5">
                {COMMON_ALLERGENS.map((alg) => {
                  const active = selectedAllergens.includes(alg);
                  return (
                    <button
                      key={alg}
                      type="button"
                      onClick={() => toggleAllergen(alg)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors shadow-2xs ${
                        active
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {alg}
                    </button>
                  );
                })}
              </div>
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="Add custom allergen tag..."
                  value={customAllergen}
                  onChange={(e) => setCustomAllergen(e.target.value)}
                  className="rounded-xl text-xs"
                />
                <Button type="button" size="sm" variant="outline" onClick={handleAddCustomAllergen} className="rounded-xl">
                  Add Tag
                </Button>
              </div>
            </div>
          </div>

          {/* Section 3: Nutrition per 100g / 100ml */}
          <div className="space-y-4 pt-2 border-t border-slate-100">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-slate-400" />
              <span>3. Nutrition Facts per 100g / 100ml</span>
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <Label className="block text-[11px] font-semibold text-slate-600 mb-1">Calories (kcal)</Label>
                <Input
                  type="number"
                  step="any"
                  min="0"
                  placeholder="e.g. 240"
                  value={energyKcal}
                  onChange={(e) => setEnergyKcal(e.target.value)}
                  className="rounded-xl text-xs"
                />
              </div>
              <div>
                <Label className="block text-[11px] font-semibold text-slate-600 mb-1">Proteins (g)</Label>
                <Input
                  type="number"
                  step="any"
                  min="0"
                  placeholder="e.g. 0.5"
                  value={proteins}
                  onChange={(e) => setProteins(e.target.value)}
                  className="rounded-xl text-xs"
                />
              </div>
              <div>
                <Label className="block text-[11px] font-semibold text-slate-600 mb-1">Carbohydrates (g)</Label>
                <Input
                  type="number"
                  step="any"
                  min="0"
                  placeholder="e.g. 58"
                  value={carbohydrates}
                  onChange={(e) => setCarbohydrates(e.target.value)}
                  className="rounded-xl text-xs"
                />
              </div>
              <div>
                <Label className="block text-[11px] font-semibold text-slate-600 mb-1">Sugars (g)</Label>
                <Input
                  type="number"
                  step="any"
                  min="0"
                  placeholder="e.g. 52"
                  value={sugars}
                  onChange={(e) => setSugars(e.target.value)}
                  className="rounded-xl text-xs"
                />
              </div>
              <div>
                <Label className="block text-[11px] font-semibold text-slate-600 mb-1">Total Fat (g)</Label>
                <Input
                  type="number"
                  step="any"
                  min="0"
                  placeholder="e.g. 0.1"
                  value={fat}
                  onChange={(e) => setFat(e.target.value)}
                  className="rounded-xl text-xs"
                />
              </div>
              <div>
                <Label className="block text-[11px] font-semibold text-slate-600 mb-1">Saturated Fat (g)</Label>
                <Input
                  type="number"
                  step="any"
                  min="0"
                  placeholder="e.g. 0.0"
                  value={saturatedFat}
                  onChange={(e) => setSaturatedFat(e.target.value)}
                  className="rounded-xl text-xs"
                />
              </div>
              <div>
                <Label className="block text-[11px] font-semibold text-slate-600 mb-1">Dietary Fiber (g)</Label>
                <Input
                  type="number"
                  step="any"
                  min="0"
                  placeholder="e.g. 0.8"
                  value={fiber}
                  onChange={(e) => setFiber(e.target.value)}
                  className="rounded-xl text-xs"
                />
              </div>
              <div>
                <Label className="block text-[11px] font-semibold text-slate-600 mb-1">Sodium (g)</Label>
                <Input
                  type="number"
                  step="any"
                  min="0"
                  placeholder="e.g. 0.04"
                  value={sodium}
                  onChange={(e) => setSodium(e.target.value)}
                  className="rounded-xl text-xs"
                />
              </div>
              <div>
                <Label className="block text-[11px] font-semibold text-slate-600 mb-1">Salt (g)</Label>
                <Input
                  type="number"
                  step="any"
                  min="0"
                  placeholder="e.g. 0.10"
                  value={salt}
                  onChange={(e) => setSalt(e.target.value)}
                  className="rounded-xl text-xs"
                />
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading} className="rounded-xl">
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={loading} className="rounded-xl gap-2">
              <Check className="w-4 h-4" />
              <span>{loading ? 'Saving...' : 'Save & Analyze Product'}</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
