import mongoose from 'mongoose';

// Social media analytics snapshot per platform. The seed script creates a
// daily series so the dashboard can render trend charts.
const analyticsSchema = new mongoose.Schema(
  {
    platform: {
      type: String,
      enum: ['LinkedIn', 'Instagram', 'YouTube', 'Facebook'],
      required: true,
    },
    date: { type: Date, required: true },

    // Common / platform-specific metrics (not all apply to every platform)
    profilesManaged: { type: Number, default: 0 },
    followers: { type: Number, default: 0 },
    impressions: { type: Number, default: 0 },
    reach: { type: Number, default: 0 },
    engagementRate: { type: Number, default: 0 }, // percentage
    subscribers: { type: Number, default: 0 },
    views: { type: Number, default: 0 },
    watchHours: { type: Number, default: 0 },
  },
  { timestamps: true }
);

analyticsSchema.index({ platform: 1, date: -1 });

const Analytics = mongoose.model('Analytics', analyticsSchema);
export default Analytics;
