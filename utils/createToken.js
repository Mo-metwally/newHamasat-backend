const jwt = require('jsonwebtoken');

const createTokenParts = (user) => {
  const payload = {
    h_token: { userId: user.id },
    p_token: { email: user.email, name: user.name },
    s_token: { role: user.role },
  };

  const tokenParts = {};

  Object.keys(payload).forEach(key => {
    tokenParts[key] = jwt.sign(payload[key], process.env.JWT_SECRET_KEY);
  });

  return tokenParts;
};

module.exports = createTokenParts;
