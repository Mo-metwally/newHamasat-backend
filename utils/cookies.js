const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
};

const setCookie = (res, tokenParts) => {
  const maxAge =
    Number(process.env.JWT_COOKIE_EXPIRE_TIME) * 24 * 60 * 60 * 1000;

  Object.entries(tokenParts).forEach(([partKey, value]) => {
    res.cookie(partKey, value, {
      ...cookieOptions,
      maxAge,
    });
  });
};

module.exports = { setCookie, cookieOptions };
