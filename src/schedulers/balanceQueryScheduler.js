'use strict';
const cron = require('node-cron');
const BalanceService = require('../services/BalanceService');
const ConfigService = require('../services/ConfigService');
const logger = require('../utils/logger');

let task = null;

async function run() {
  logger.info('开始定时余额查询...');
  try {
    const result = await BalanceService.queryAll('scheduled');
    logger.info('定时余额查询完成', result);
  } catch (err) {
    logger.error('定时余额查询失败', { error: err.message });
  }
}

async function start() {
  const expression = await ConfigService.get('balance_query_cron') || '0 8 * * *';
  task = cron.schedule(expression, run, { timezone: 'Asia/Shanghai' });
  logger.info('余额查询调度器已启动', { cron: expression });
}

function stop() {
  if (task) { task.stop(); task = null; }
}

module.exports = { start, stop, run };
