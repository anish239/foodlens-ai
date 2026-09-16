import mongoose from 'mongoose';

const scanHistorySchema = new mongoose.Schema(
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
      score: { type: Number, required: true },
      grade: { type: String, default: 'Moderate' },
      label: { type: String, default: 'Moderate' },
      version: { type: String, default: '1.0' },
      positives: { type: [String], default: [] },
      concerns: { type: [String], default: [] },
    },
    compatibility: {
      status: {
        type: String,
        enum: ['compatible', 'caution', 'not_compatible'],
        default: 'compatible',
      },
      summary: { type: String, default: '' },
      reasons: { type: [String], default: [] },
      conflicts: { type: [mongoose.Schema.Types.Mixed], default: [] },
      traceWarnings: { type: [mongoose.Schema.Types.Mixed], default: [] },
      positiveAlignments: { type: [mongoose.Schema.Types.Mixed], default: [] },
      missingDataWarnings: { type: [String], default: [] },
    },
    scannedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for optimal queries
scanHistorySchema.index({ user: 1, scannedAt: -1 });
scanHistorySchema.index({ user: 1, barcode: 1 });

export const ScanHistory = mongoose.model('ScanHistory', scanHistorySchema);
export default ScanHistory;
