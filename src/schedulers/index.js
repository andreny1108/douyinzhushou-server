'use strict';
const balanceQueryScheduler = require('./balanceQueryScheduler');
const monthlyRechargeScheduler = require('./monthlyRechargeScheduler');
const retryScheduler = require('./retryScheduler');
const logger = require('../utils/logger');

async function start() {
  try {
    await balanceQueryScheduler.start();
    await monthlyRechargeScheduler.start();
    await retryScheduler.start();
  } catch (err) {
    logger.error('调度器启动失败', { error: err.message });
  }
}

function stop() {
  balanceQueryScheduler.stop();
  monthlyRechargeScheduler.stop();
  retryScheduler.stop();
}

module.exports = { start, stop };
