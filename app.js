'use strict';
const express = require('express');
const { auth } = require('./src/middlewares/auth');
const { errorHandler } = require('./src/middlewares/errorHandler');
const routes = require('./src/routes');

function createApp() {
  const app = express();
  app.use(express.json());

  // health 接口不需要鉴权
  app.use('/api/v1/health', require('./src/routes/health'));

  // 其余接口需要 X-Api-Key
  app.use('/api/v1', auth, routes);

  app.use(errorHandler);
  return app;
}

module.exports = createApp;
