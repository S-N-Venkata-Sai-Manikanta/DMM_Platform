import asyncHandler from 'express-async-handler';
import Analytics from '../models/Analytics.js';
import { logActivity } from '../utils/logActivity.js';
import { ACTIVITY_ACTIONS, PLATFORMS } from '../config/constants.js';

// Fields each platform exposes — drives validation and the admin UI.
export const PLATFORM_FIELDS = {
  LinkedIn: ['profilesManaged', 'followers', 'impressions', 'engagementRate'],
  Instagram: ['followers', 'reach', 'engagementRate'],
  YouTube: ['subscribers', 'views', 'watchHours', 'engagementRate'],
  Facebook: ['followers', 'reach', 'engagementRate'],
};

// @route GET /api/analytics — latest snapshot per platform (for management + dashboard)
export const getAnalytics = asyncHandler(async (req, res) => {
  const latest = {};
  for (const platform of PLATFORMS) {
    latest[platform] = await Analytics.findOne({ platform }).sort({ date: -1 }).lean();
  }
  res.json({ success: true, fields: PLATFORM_FIELDS, latest });
});

// @route GET /api/analytics/:platform/history — recent snapshots for trend display
export const getPlatformHistory = asyncHandler(async (req, res) => {
  const { platform } = req.params;
  if (!PLATFORMS.includes(platform)) { res.status(400); throw new Error('Invalid platform'); }
  const history = await Analytics.find({ platform }).sort({ date: -1 }).limit(30).lean();
  res.json({ success: true, platform, history: history.reverse() });
});

// @route POST /api/analytics  (ADMIN/CEO) — record a new metrics snapshot for a platform
export const recordAnalytics = asyncHandler(async (req, res) => {
  const { platform } = req.body;
  if (!PLATFORMS.includes(platform)) { res.status(400); throw new Error('Invalid platform'); }

  const allowed = PLATFORM_FIELDS[platform];
  const doc = { platform, date: new Date() };
  for (const field of allowed) {
    const val = Number(req.body[field]);
    doc[field] = Number.isFinite(val) && val >= 0 ? val : 0;
  }
  const snapshot = await Analytics.create(doc);

  logActivity({ user: req.user._id, action: ACTIVITY_ACTIONS.ANALYTICS_UPDATED, description: `Updated ${platform} analytics`, entityType: 'Analytics', entityId: snapshot._id });
  res.status(201).json({ success: true, snapshot });
});
