'use strict';
const logger = require('../utils/logger');

function errorHandler(err, req, res, next) {
  const status = err.statusCode || 500;
  if (status >= 500) logger.error('Server error', { url: req.url, error: err.message, stack: err.stack });
  res.status(status).json({ error: err.message || '服务器内部错误' });
}

module.exports = { errorHandler };
