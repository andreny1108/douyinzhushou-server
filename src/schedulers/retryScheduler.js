'use strict';
const cron = require('node-cron');
const RechargeService = require('../services/RechargeService');
const ConfigService = require('../services/ConfigService');
const logger = require('../utils/logger');

let task = null;

async function run() {
  try {
    await RechargeService.retryFailed();
  } catch (err) {
    logger.error('重试调度器执行失败', { error: err.message });
  }
}

async function start() {
  const expression = await ConfigService.get('retry_cron') || '*/5 * * * *';
  task = cron.schedule(expression, run, { timezone: 'Asia/Shanghai' });
  logger.info('充值重试调度器已启动', { cron: expression });
}

function stop() {
  if (task) { task.stop(); task = null; }
}

module.exports = { start, stop, run };
