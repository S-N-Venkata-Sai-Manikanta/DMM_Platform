import asyncHandler from 'express-async-handler';
import ApprovalRequest from '../models/ApprovalRequest.js';
import Template from '../models/Template.js';
import Asset from '../models/Asset.js';
import User from '../models/User.js';
import { ROLES } from '../config/constants.js';

// @route GET /api/search?q=...  — global search across entities.
// Searches approvals (title/caption/platform), templates, assets, and (CEO only) users.
export const globalSearch = asyncHandler(async (req, res) => {
  const q = (req.query.q || '').trim();
  if (q.length < 2) return res.json({ success: true, results: { approvals: [], templates: [], assets: [], users: [] } });

  const rx = { $regex: q, $options: 'i' };
  const isCEO = [ROLES.ADMIN, ROLES.CEO].includes(req.user.role);
  const approvalScope = isCEO ? {} : { createdBy: req.user._id };

  const [approvals, templates, assets, users] = await Promise.all([
    ApprovalRequest.find({
      ...approvalScope,
      $or: [{ title: rx }, { caption: rx }, { platform: rx }],
    })
      .populate('createdBy', 'name')
      .select('title platform status createdBy')
      .sort({ createdAt: -1 })
      .limit(6)
      .lean(),
    Template.find({ $or: [{ name: rx }, { description: rx }, { category: rx }] })
      .select('name category thumbnail')
      .limit(6)
      .lean(),
    Asset.find({ $or: [{ name: rx }, { description: rx }, { category: rx }] })
      .select('name category previewImage')
      .limit(6)
      .lean(),
    isCEO
      ? User.find({ $or: [{ name: rx }, { email: rx }] }).select('name email avatar role').limit(6).lean()
      : Promise.resolve([]),
  ]);

  res.json({ success: true, query: q, results: { approvals, templates, assets, users } });
});
