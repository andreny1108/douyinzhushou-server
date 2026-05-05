'use strict';
const env = require('../../config/env');

function auth(req, res, next) {
  const key = req.headers['x-api-key'];
  if (!key || key !== env.API_KEY) {
    return res.status(401).json({ error: '无效的 API Key' });
  }
  next();
}

module.exports = { auth };
