'use strict';
const axios = require('axios');
const db = require('../../config/database');
const ConfigService = require('./ConfigService');
const logger = require('../utils/logger');

const CARRIER_LABEL = { mobile: '移动', unicom: '联通', telecom: '电信' };

async function sendWebhook(message) {
  const webhookUrl = await ConfigService.get('alert_webhook_url');
  if (!webhookUrl) return;
  try {
    await axios.post(webhookUrl, {
      msgtype: 'text',
      text: { content: message },
    }, { timeout: 5000 });
  } catch (err) {
    logger.error('Webhook 发送失败', { error: err.message });
  }
}

async function logAlert(phoneId, alertType, message, channel, status) {
  try {
    await db.query(
      'INSERT INTO alert_logs (phone_id, alert_type, message, channel, status) VALUES (?, ?, ?, ?, ?)',
      [phoneId, alertType, message, channel, status]
    );
  } catch (err) {
    logger.error('记录告警日志失败', { error: err.message });
  }
}

/**
 * 批量发送低余额告警（合并为一条消息）
 * @param {Array<{phone, carrier, owner_name, current_balance, low_balance_threshold, id}>} phones
 */
async function sendLowBalanceAlert(phones) {
  if (!phones.length) return;
  const lines = phones.map(p =>
    `• ${p.phone}（${CARRIER_LABEL[p.carrier] || p.carrier}）${p.owner_name} 余额 ${p.current_balance}元，预警阈值 ${p.low_balance_threshold}元`
  );
  const message = `【手机号余额预警】\n以下号码余额不足，请及时充值：\n${lines.join('\n')}`;
  await sendWebhook(message);
  for (const p of phones) {
    await logAlert(p.id, 'low_balance', message, 'webhook', 'sent');
  }
}

async function sendRechargeFailed(phone, amount, errorMessage) {
  const message = `【充值失败】\n号码：${phone.phone}（${CARRIER_LABEL[phone.carrier]}）${phone.owner_name}\n金额：${amount}元\n原因：${errorMessage}\n请人工处理。`;
  await sendWebhook(message);
  await logAlert(phone.id, 'recharge_failed', message, 'webhook', 'sent');
}

async function sendRechargeSuccess(phone, amount, orderId) {
  const message = `【充值成功】\n号码：${phone.phone}（${CARRIER_LABEL[phone.carrier]}）${phone.owner_name}\n金额：${amount}元\n订单号：${orderId}`;
  logger.info('充值成功', { phone: phone.phone, amount, orderId });
  await logAlert(phone.id, 'recharge_success', message, 'webhook', 'sent');
}

module.exports = { sendLowBalanceAlert, sendRechargeFailed, sendRechargeSuccess };
