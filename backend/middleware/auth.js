const jwt = require('jsonwebtoken');
const User = require('../models/User');

const getJwtSecret = () => process.env.JWT_SECRET || 'cinematic_jira_secret_key_999!';

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token || token === 'undefined' || token === 'null') {
    return res.status(401).json({ error: 'Access token required. Please sign in.' });
  }

  const secret = getJwtSecret();
  jwt.verify(token, secret, async (err, decodedUser) => {
    if (err) {
      return res.status(401).json({ error: 'Session expired or token invalid. Please sign in again.' });
    }

    try {
      const user = await User.findById(decodedUser.id);
      if (!user) {
        return res.status(401).json({ error: 'User account no longer exists.' });
      }

      const isInactive = String(user.accountStatus || user.status || '').toLowerCase().includes('inactive');
      if (isInactive) {
        return res.status(403).json({ error: 'Account deactivated. Access revoked.' });
      }

      const role = String(user.role || decodedUser.role || 'employee').toLowerCase();
      req.user = {
        id: user._id,
        email: user.email,
        name: user.name,
        role
      };
      next();
    } catch (dbErr) {
      const role = String(decodedUser.role || 'employee').toLowerCase();
      req.user = {
        id: decodedUser.id,
        email: decodedUser.email,
        name: decodedUser.name,
        role
      };
      next();
    }
  });
};

module.exports = { authenticateToken, JWT_SECRET: getJwtSecret() };
