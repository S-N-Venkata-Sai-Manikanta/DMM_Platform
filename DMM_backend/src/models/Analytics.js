import mongoose from 'mongoose';

// Social media analytics snapshot per platform. The seed script creates a
// daily series so the dashboard can render trend charts.
const analyticsSchema = new mongoose.Schema(
  {
    organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    platform: {
      type: String,
      enum: ['LinkedIn', 'Instagram', 'YouTube', 'Facebook'],
      required: true,
    },
    date: { type: Date, required: true },

    // ---- Audience / Followers ----
    profilesManaged: { type: Number, default: 0 },
    followers: { type: Number, default: 0 }, // total followers
    newFollowers: { type: Number, default: 0 }, // gained this period
    followersLast30Days: { type: Number, default: 0 }, // gained in last 30 days
    subscribers: { type: Number, default: 0 }, // YouTube

    // ---- Discovery / Reach ----
    impressions: { type: Number, default: 0 }, // post impressions
    reach: { type: Number, default: 0 },
    searchAppearances: { type: Number, default: 0 },
    views: { type: Number, default: 0 }, // YouTube
    watchHours: { type: Number, default: 0 }, // YouTube

    // ---- Engagement ----
    engagementRate: { type: Number, default: 0 }, // percentage
    reactions: { type: Number, default: 0 },
    comments: { type: Number, default: 0 },
    reposts: { type: Number, default: 0 },

    // ---- Visitors ----
    pageViews: { type: Number, default: 0 },
    uniqueVisitors: { type: Number, default: 0 },
  },
  { timestamps: true }
);

analyticsSchema.index({ organization: 1, platform: 1, date: -1 });

const Analytics = mongoose.model('Analytics', analyticsSchema);
export default Analytics;
