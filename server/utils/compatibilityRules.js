export const COMPATIBILITY_VERSION = '1.0';

export const ALLERGEN_ALIASES = {
  peanuts: ['peanut', 'peanuts', 'groundnut'],
  nuts: ['nut', 'nuts', 'tree nuts', 'almond', 'walnut', 'cashew', 'hazelnut', 'pecan', 'pistachio', 'macadamia', 'brazil nut'],
  milk: ['milk', 'dairy', 'butter', 'cream', 'cheese', 'whey', 'casein', 'lactose', 'ghee'],
  lactose: ['lactose', 'milk', 'dairy'],
  soy: ['soy', 'soya', 'soybean', 'soy lecithin'],
  egg: ['egg', 'eggs', 'egg powder', 'albumin', 'egg white', 'egg yolk'],
  gluten: ['gluten', 'wheat', 'barley', 'rye', 'spelt', 'kamut', 'triticale'],
  wheat: ['wheat', 'gluten', 'wheat flour', 'durum', 'semolina'],
  fish: ['fish', 'salmon', 'tuna', 'cod', 'anchovy', 'sardine', 'mackerel'],
  shellfish: ['shellfish', 'crustaceans', 'molluscs', 'shrimp', 'crab', 'lobster', 'prawn', 'clam', 'mussel', 'oyster'],
  sesame: ['sesame', 'tahini', 'sesame seed'],
};

export const RESTRICTION_MAP = {
  'gluten-free': ['gluten', 'wheat'],
  'lactose-free': ['lactose', 'milk'],
  'dairy-free': ['milk'],
  'nut-free': ['nuts'],
  'peanut-free': ['peanuts'],
  'soy-free': ['soy'],
  'egg-free': ['egg'],
};

export const ANIMAL_MEAT_TERMS = ['meat', 'beef', 'pork', 'chicken', 'lamb', 'mutton', 'veal', 'turkey', 'duck', 'bacon', 'ham', 'gelatin'];
export const FISH_SHELLFISH_TERMS = ['fish', 'salmon', 'tuna', 'cod', 'anchovy', 'shellfish', 'shrimp', 'crab', 'lobster', 'prawn'];
export const DAIRY_EGG_TERMS = ['milk', 'dairy', 'butter', 'cream', 'cheese', 'whey', 'casein', 'lactose', 'egg', 'eggs', 'honey', 'gelatin'];

export const matchesTermList = (text, terms) => {
  if (!text || typeof text !== 'string') return false;
  const lower = text.toLowerCase();
  return terms.some(term => {
    const regex = new RegExp(`\\b${term}\\b`, 'i');
    return regex.test(lower);
  });
};

export const normalizeAllergenString = (str) => {
  if (!str || typeof str !== 'string') return '';
  return str.toLowerCase().replace(/^en:/, '').trim();
};
