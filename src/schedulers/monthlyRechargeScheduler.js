'use strict';
const cron = require('node-cron');
const PhoneService = require('../services/PhoneService');
const RuleService = require('../services/RuleService');
const RechargeService = require('../services/RechargeService');
const ConfigService = require('../services/ConfigService');
const logger = require('../utils/logger');

let task = null;

async function run() {
  const today = new Date().getDate();
  logger.info(`开始月度充值检测（今日 ${today} 号）...`);

  const phones = await PhoneService.listActive();
  let triggered = 0;

  for (const phone of phones) {
    try {
      const rule = await RuleService.getEffectiveRule(phone.id);
      if (!rule) continue;

      const shouldRechargeMonthly = (rule.trigger_type === 'monthly' || rule.trigger_type === 'both') && rule.monthly_day === today;
      const shouldRechargeLowBalance = (rule.trigger_type === 'low_balance' || rule.trigger_type === 'both') &&
        phone.current_balance !== null &&
        phone.current_balance < (rule.low_balance_threshold || phone.low_balance_threshold);

      if (!shouldRechargeMonthly && !shouldRechargeLowBalance) continue;

      // 月度充值上限检查
      const monthlyTotal = await RuleService.getMonthlyRechargedAmount(phone.id);
      if (monthlyTotal + rule.recharge_amount > rule.max_monthly_recharge) {
        logger.warn('本月充值已达上限，跳过', { phone: phone.phone, monthlyTotal, cap: rule.max_monthly_recharge });
        continue;
      }

      const triggerType = shouldRechargeMonthly ? 'scheduled' : 'low_balance';
      await RechargeService.execute({
        phoneId: phone.id,
        amount: rule.recharge_amount,
        triggerType,
        triggeredBy: 'cron',
      });
      triggered++;
    } catch (err) {
      logger.error('月度充值处理失败', { phone: phone.phone, error: err.message });
    }
  }

  logger.info('月度充值检测完成', { total: phones.length, triggered });
}

async function start() {
  const expression = await ConfigService.get('monthly_recharge_cron') || '0 9 * * *';
  task = cron.schedule(expression, run, { timezone: 'Asia/Shanghai' });
  logger.info('月度充值调度器已启动', { cron: expression });
}

function stop() {
  if (task) { task.stop(); task = null; }
}

module.exports = { start, stop, run };
