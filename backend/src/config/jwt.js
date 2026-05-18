const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'goalsync-pro-secret-key-change-in-production';

const generateToken = (payload, expiresIn = process.env.JWT_EXPIRES_IN || '7d') => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
};

const verifyToken = (token) => {
  return jwt.verify(token, JWT_SECRET);
};

module.exports = { generateToken, verifyToken };
