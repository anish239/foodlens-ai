import mongoose from 'mongoose';

const favoriteSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    barcode: {
      type: String,
      required: true,
      trim: true,
    },
    product: {
      barcode: { type: String, required: true },
      name: { type: String, required: true },
      brand: { type: String, default: 'Unknown Brand' },
      image: { type: String, default: null },
      quantity: { type: String, default: null },
      servingSize: { type: String, default: null },
      nutrition: {
        energyKcal: { type: Number, default: null },
        sugars: { type: Number, default: null },
        proteins: { type: Number, default: null },
        fiber: { type: Number, default: null },
        fat: { type: Number, default: null },
        saturatedFat: { type: Number, default: null },
        salt: { type: Number, default: null },
        sodium: { type: Number, default: null },
      },
      nutriscore: { type: String, default: null },
      novaGroup: { type: Number, default: null },
      allergens: { type: [String], default: [] },
      traces: { type: [String], default: [] },
    },
    score: {
      score: { type: Number, default: null },
      grade: { type: String, default: null },
      label: { type: String, default: null },
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index: A user cannot favorite the same product twice
favoriteSchema.index({ user: 1, barcode: 1 }, { unique: true });
favoriteSchema.index({ user: 1, createdAt: -1 });

export const Favorite = mongoose.model('Favorite', favoriteSchema);
export default Favorite;
