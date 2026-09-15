const jwt = require('jsonwebtoken');

const signToken = (userId) => {
  const secret = process.env.JWT_SECRET || 'supersecretjwtkey_loomstore_2026';
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';

  return jwt.sign({ id: userId }, secret, {
    expiresIn,
  });
};

const verifyToken = (token) => {
  const secret = process.env.JWT_SECRET || 'supersecretjwtkey_loomstore_2026';
  return jwt.verify(token, secret);
};

module.exports = {
  signToken,
  verifyToken,
};
