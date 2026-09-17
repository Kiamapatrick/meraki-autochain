const User = require('../models/User');

const { generateToken } = require('../controllers/auth.controller');

// GET /api/user/profile
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    res.status(200).json({ success: true, user });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ success: false, message: 'Could not retrieve profile.' });
  }
};

// PUT /api/user/profile
const updateProfile = async (req, res) => {
  try {
    const { name, phone } = req.body;
    const updates = {};
    if (name  && typeof name  === 'string') updates.name  = name.trim();
    if (phone && typeof phone === 'string') updates.phone = phone.trim();

    if (!Object.keys(updates).length) {
      return res.status(400).json({ success: false, message: 'No valid fields to update.' });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password');

    res.status(200).json({ success: true, user });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ success: false, message: 'Could not update profile.' });
  }
};

// PUT /api/user/password
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Current password and new password are required.' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, message: 'New password must be at least 8 characters.' });
    }

    // Get user with password
    const user = await User.findById(req.user._id).select('+password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    // Verify current password
    const match = await user.comparePassword(currentPassword);
    if (!match) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect.' });
    }

    // Update password and increment tokenVersion to invalidate other sessions
    user.password = newPassword;
    user.tokenVersion = (user.tokenVersion || 0) + 1;
    await user.save();

    // Generate new token with updated tokenVersion
    const token = generateToken(user._id, user.tokenVersion);

    res.status(200).json({
      success: true,
      message: 'Password changed successfully. Other sessions have been logged out.',
      token,
      tokenVersion: user.tokenVersion,
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ success: false, message: 'Could not change password.' });
  }
};

// DELETE /api/user/account (soft delete)
const deleteAccount = async (req, res) => {
  try {
    const { password, confirm } = req.body;

    if (!password) {
      return res.status(400).json({ success: false, message: 'Password is required to delete account.' });
    }

    if (confirm !== 'DELETE') {
      return res.status(400).json({ success: false, message: 'Please type DELETE to confirm account deletion.' });
    }

    // Get user with password
    const user = await User.findById(req.user._id).select('+password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    // Verify password
    const match = await user.comparePassword(password);
    if (!match) {
      return res.status(401).json({ success: false, message: 'Incorrect password.' });
    }

    // Soft delete - mark as deleted
    user.deleted = true;
    user.email = `deleted_${user._id}_${user.email}`;
    user.name = 'Deleted User';
    user.password = 'deleted';
    user.tokenVersion = (user.tokenVersion || 0) + 1;
    user.partnerStatus = 'rejected';
    await user.save();

    res.status(200).json({ success: true, message: 'Account deleted successfully.' });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ success: false, message: 'Could not delete account.' });
  }
};

// POST /api/auth/revoke-all
const revokeAllSessions = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    user.tokenVersion = (user.tokenVersion || 0) + 1;
    await user.save();

    const token = generateToken(user._id, user.tokenVersion);

    res.status(200).json({
      success: true,
      message: 'All other sessions have been revoked.',
      token,
      tokenVersion: user.tokenVersion,
    });
  } catch (error) {
    console.error('Revoke all sessions error:', error);
    res.status(500).json({ success: false, message: 'Could not revoke sessions.' });
  }
};

module.exports = { getProfile, updateProfile, changePassword, deleteAccount, revokeAllSessions };
