import asyncHandler from 'express-async-handler';
import ActivityLog from '../models/ActivityLog.js';
import { ROLES } from '../config/constants.js';

// @route GET /api/activity — paginated activity logs (CEO: all, user: own)
export const getActivityLogs = asyncHandler(async (req, res) => {
  const { action, page = 1, limit = 20 } = req.query;
  const query = [ROLES.ADMIN, ROLES.CEO].includes(req.user.role) ? {} : { user: req.user._id };
  if (action && action !== 'All') query.action = action;

  const skip = (Number(page) - 1) * Number(limit);
  const [logs, total] = await Promise.all([
    ActivityLog.find(query).populate('user', 'name avatar').sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    ActivityLog.countDocuments(query),
  ]);
  res.json({ success: true, total, page: Number(page), pages: Math.ceil(total / limit), logs });
});
