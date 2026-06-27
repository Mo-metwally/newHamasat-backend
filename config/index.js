require('dotenv').config();

module.exports = {
  env: process.env.NODE_ENV,
  port: process.env.PORT || 5000,
  db_url: process.env.DB_URL,
  allowList: process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : [],

  defaultAdminEmail: process.env.DEFAULT_ADMIN_EMAIL,
  defaultAdminPassword: process.env.DEFAULT_ADMIN_PASSWORD,
};
