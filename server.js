'use strict';
require('dotenv').config();
const env = require('./config/env');
const createApp = require('./app');
const schedulers = require('./src/schedulers');
const ConfigService = require('./src/services/ConfigService');
const AdapterFactory = require('./src/adapters/AdapterFactory');
const logger = require('./src/utils/logger');

AdapterFactory.setConfigService(ConfigService);

const app = createApp();

app.listen(env.PORT, () => {
  logger.info(`phonenumber-xitong 已启动`, { port: env.PORT, env: env.NODE_ENV });
  schedulers.start();
});

process.on('SIGTERM', () => {
  logger.info('收到 SIGTERM，停止调度器...');
  schedulers.stop();
  process.exit(0);
});
