import asyncHandler from 'express-async-handler';
import User from '../models/User.js';
import { uploadBuffer, deleteFile } from '../config/storage.js';
import { logActivity } from '../utils/logActivity.js';
import { sendEmail } from '../utils/email.js';
import { ROLES, ACTIVITY_ACTIONS } from '../config/constants.js';

const sanitize = (u) => ({
  _id: u._id,
  name: u.name,
  email: u.email,
  role: u.role,
  avatar: u.avatar,
  jobTitle: u.jobTitle,
  isActive: u.isActive,
  settings: u.settings,
  createdAt: u.createdAt,
});

// ============================ ADMIN ============================

// @route GET /api/users  (ADMIN) — list with search + role filter
export const getUsers = asyncHandler(async (req, res) => {
  const { search, role } = req.query;
  const query = {};
  if (role && role !== 'All') query.role = role;
  if (search) query.$or = [
    { name: { $regex: search, $options: 'i' } },
    { email: { $regex: search, $options: 'i' } },
  ];
  const users = await User.find(query).sort({ createdAt: -1 });
  res.json({ success: true, count: users.length, users: users.map(sanitize) });
});

// @route POST /api/users  (ADMIN) — create a new user
export const createUser = asyncHandler(async (req, res) => {
  const { name, email, password, role, jobTitle } = req.body;
  if (!name || !email || !password) {
    res.status(400);
    throw new Error('Name, email and password are required');
  }
  if (password.length < 6) {
    res.status(400);
    throw new Error('Password must be at least 6 characters');
  }
  if (role && !Object.values(ROLES).includes(role)) {
    res.status(400);
    throw new Error('Invalid role');
  }
  const exists = await User.findOne({ email: email.toLowerCase() });
  if (exists) {
    res.status(400);
    throw new Error('A user with this email already exists');
  }
  const user = await User.create({ name, email, password, role: role || ROLES.USER, jobTitle: jobTitle || '' });

  logActivity({ user: req.user._id, action: ACTIVITY_ACTIONS.USER_CREATED, description: `Created user "${name}" (${user.role})`, entityType: 'User', entityId: user._id });

  // Welcome email (only if SMTP configured) — never blocks the response.
  sendEmail({
    to: user.email,
    subject: 'Your DMM Platform account is ready',
    html: `<div style="font-family:Inter,Arial,sans-serif">
        <h2 style="color:#4f46e5">Welcome to DMM Platform</h2>
        <p>Hi ${name}, an account has been created for you with the role <b>${user.role}</b>.</p>
        <p>You can sign in at <a href="${process.env.CLIENT_URL?.split(',')[0] || ''}">the platform</a> using your email and the password provided by your administrator.</p>
      </div>`,
  });

  res.status(201).json({ success: true, user: sanitize(user) });
});

// @route GET /api/users/:id  (ADMIN)
export const getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) { res.status(404); throw new Error('User not found'); }
  res.json({ success: true, user: sanitize(user) });
});

// @route PUT /api/users/:id  (ADMIN) — update name, role, jobTitle, isActive
export const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) { res.status(404); throw new Error('User not found'); }

  const { name, role, jobTitle, isActive } = req.body;

  // Guard: don't allow removing the last active admin or self-demotion lockout
  if (role && role !== user.role && user.role === ROLES.ADMIN && role !== ROLES.ADMIN) {
    const adminCount = await User.countDocuments({ role: ROLES.ADMIN, isActive: true });
    if (adminCount <= 1) { res.status(400); throw new Error('Cannot change the role of the last admin'); }
  }
  if (isActive === false && user.role === ROLES.ADMIN) {
    const adminCount = await User.countDocuments({ role: ROLES.ADMIN, isActive: true });
    if (adminCount <= 1) { res.status(400); throw new Error('Cannot deactivate the last admin'); }
  }

  if (name) user.name = name;
  if (jobTitle !== undefined) user.jobTitle = jobTitle;
  if (role && Object.values(ROLES).includes(role)) user.role = role;
  if (typeof isActive === 'boolean') user.isActive = isActive;
  await user.save();

  const action = isActive === false ? ACTIVITY_ACTIONS.USER_DEACTIVATED : ACTIVITY_ACTIONS.USER_UPDATED;
  logActivity({ user: req.user._id, action, description: `Updated user "${user.name}"`, entityType: 'User', entityId: user._id });

  res.json({ success: true, user: sanitize(user) });
});

// @route PUT /api/users/:id/reset-password  (ADMIN)
export const adminResetPassword = asyncHandler(async (req, res) => {
  const { password } = req.body;
  if (!password || password.length < 6) {
    res.status(400);
    throw new Error('Password must be at least 6 characters');
  }
  const user = await User.findById(req.params.id);
  if (!user) { res.status(404); throw new Error('User not found'); }
  user.password = password;
  await user.save();
  logActivity({ user: req.user._id, action: ACTIVITY_ACTIONS.USER_UPDATED, description: `Reset password for "${user.name}"`, entityType: 'User', entityId: user._id });
  res.json({ success: true, message: 'Password reset successfully' });
});

// @route DELETE /api/users/:id  (ADMIN)
export const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) { res.status(404); throw new Error('User not found'); }
  if (String(user._id) === String(req.user._id)) { res.status(400); throw new Error('You cannot delete your own account'); }
  if (user.role === ROLES.ADMIN) {
    const adminCount = await User.countDocuments({ role: ROLES.ADMIN });
    if (adminCount <= 1) { res.status(400); throw new Error('Cannot delete the last admin'); }
  }
  if (user.avatarPublicId) await deleteFile(user.avatarPublicId);
  await user.deleteOne();
  logActivity({ user: req.user._id, action: ACTIVITY_ACTIONS.USER_DEACTIVATED, description: `Deleted user "${user.name}"`, entityType: 'User', entityId: user._id });
  res.json({ success: true, message: 'User deleted' });
});

// ============================ SELF ============================

// @route PUT /api/users/profile
export const updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const { name, jobTitle } = req.body;
  if (name) user.name = name;
  if (jobTitle !== undefined) user.jobTitle = jobTitle;

  if (req.file) {
    if (user.avatarPublicId) await deleteFile(user.avatarPublicId);
    const { url, publicId } = await uploadBuffer(req.file.buffer, {
      folder: 'avatars',
      originalName: req.file.originalname,
    });
    user.avatar = url;
    user.avatarPublicId = publicId;
  }
  await user.save();
  res.json({ success: true, user: sanitize(user) });
});

// @route PUT /api/users/password
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select('+password');
  if (!(await user.matchPassword(currentPassword))) {
    res.status(400);
    throw new Error('Current password is incorrect');
  }
  if (!newPassword || newPassword.length < 6) {
    res.status(400);
    throw new Error('New password must be at least 6 characters');
  }
  user.password = newPassword;
  await user.save();
  res.json({ success: true, message: 'Password updated' });
});

// @route PUT /api/users/settings  — theme + notification prefs
export const updateSettings = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const { theme, notifications } = req.body;
  if (theme) user.settings.theme = theme;
  if (notifications) {
    user.settings.notifications = { ...user.settings.notifications.toObject?.() ?? user.settings.notifications, ...notifications };
  }
  await user.save();
  res.json({ success: true, settings: user.settings });
});
