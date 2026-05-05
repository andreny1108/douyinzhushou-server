'use strict';
require('dotenv').config();

function required(name) {
  const val = process.env[name];
  if (!val) throw new Error(`Missing required env var: ${name}`);
  return val;
}

function optional(name, defaultVal = '') {
  return process.env[name] || defaultVal;
}

module.exports = {
  PORT: parseInt(optional('PORT', '3000'), 10),
  NODE_ENV: optional('NODE_ENV', 'development'),
  API_KEY: required('API_KEY'),

  DB_HOST: optional('DB_HOST', '127.0.0.1'),
  DB_PORT: parseInt(optional('DB_PORT', '3306'), 10),
  DB_NAME: optional('DB_NAME', 'phonenumber_xitong'),
  DB_USER: optional('DB_USER', 'root'),
  DB_PASSWORD: optional('DB_PASSWORD', ''),

  CONFIG_ENCRYPTION_KEY: optional('CONFIG_ENCRYPTION_KEY', ''),

  ACTIVE_ADAPTER: optional('ACTIVE_ADAPTER', 'mock'),
  ALERT_WEBHOOK_URL: optional('ALERT_WEBHOOK_URL', ''),
  LOW_BALANCE_THRESHOLD: parseFloat(optional('LOW_BALANCE_THRESHOLD', '10')),
};
