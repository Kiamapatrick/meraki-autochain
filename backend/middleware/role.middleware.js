/**
 * Role-based access control middleware.
 *
 * Usage:
 *   requireRole('inspector')
 *   requireRole('dealer', 'admin')   // multiple roles allowed
 *
 * Must be used after requireAuth, which attaches req.user.
 */
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. This route requires role: ${roles.join(' or ')}. Your role: ${req.user.role}.`,
      });
    }

    next();
  };
};

module.exports = { requireRole };
