'use strict';
const db = require('../../config/database');
const PhoneService = require('./PhoneService');
const RuleService = require('./RuleService');
const AlertService = require('./AlertService');
const AdapterFactory = require('../adapters/AdapterFactory');
const ConfigService = require('./ConfigService');
const logger = require('../utils/logger');
const { parsePagination, paginatedResponse } = require('../utils/pagination');

async function execute({ phoneId, amount, triggerType = 'manual', triggeredBy = 'system', parentLogId = null, retryCount = 0 }) {
  const phone = await PhoneService.getById(phoneId);
  if (!phone) throw Object.assign(new Error('手机号不存在'), { statusCode: 404 });

  // 写 pending 记录
  const logResult = await db.query(
    `INSERT INTO recharge_logs (phone_id, phone, carrier, amount, trigger_type, triggered_by, adapter_name, status, balance_before, retry_count, parent_log_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?)`,
    [phoneId, phone.phone, phone.carrier, amount, triggerType, triggeredBy, 'pending', phone.current_balance, retryCount, parentLogId]
  );
  const logId = logResult.insertId;

  try {
    const adapter = await AdapterFactory.getAdapter();
    await db.query("UPDATE recharge_logs SET adapter_name = ? WHERE id = ?", [adapter.name, logId]);

    const result = await adapter.recharge(phone.phone, phone.carrier, amount);

    if (!result.success) {
      await _handleFailure(logId, phone, amount, result.errorMessage, retryCount);
      return { success: false, logId, error: result.errorMessage };
    }

    // 成功：等待 30 秒后查询新余额
    await new Promise(r => setTimeout(r, 30000));
    let balanceAfter = null;
    try {
      const { AdapterFactory: AF } = require('../adapters/AdapterFactory');
      const a2 = await AdapterFactory.getAdapter();
      const br = await a2.queryBalance(phone.phone, phone.carrier);
      if (br.success) {
        balanceAfter = br.balance;
        await PhoneService.updateBalance(phoneId, balanceAfter);
      }
    } catch (_) { /* 余额查询失败不影响充值结果 */ }

    await db.query(
      "UPDATE recharge_logs SET status = 'success', adapter_order_id = ?, balance_after = ?, completed_at = NOW() WHERE id = ?",
      [result.orderId, balanceAfter, logId]
    );

    await AlertService.sendRechargeSuccess(phone, amount, result.orderId);
    logger.info('充值成功', { phone: phone.phone, amount, orderId: result.orderId });
    return { success: true, logId, orderId: result.orderId };

  } catch (err) {
    await _handleFailure(logId, phone, amount, err.message, retryCount);
    return { success: false, logId, error: err.message };
  }
}

async function _handleFailure(logId, phone, amount, errorMessage, retryCount) {
  const maxRetries = parseInt(await ConfigService.get('max_retry_attempts') || '3', 10);
  const delayMinutes = parseInt(await ConfigService.get('retry_delay_minutes') || '30', 10);
  const nextRetry = retryCount < maxRetries
    ? new Date(Date.now() + delayMinutes * Math.pow(2, retryCount) * 60000)
    : null;

  await db.query(
    "UPDATE recharge_logs SET status = ?, error_message = ?, next_retry_at = ?, completed_at = IF(? IS NULL, NOW(), NULL) WHERE id = ?",
    [nextRetry ? 'failed' : 'failed', errorMessage, nextRetry, nextRetry, logId]
  );

  if (!nextRetry) {
    logger.error('充值最终失败', { phone: phone.phone, amount, errorMessage });
    await AlertService.sendRechargeFailed(phone, amount, errorMessage);
  } else {
    logger.warn('充值失败，将重试', { phone: phone.phone, amount, errorMessage, nextRetry, retryCount });
  }
}

async function retryFailed() {
  const rows = await db.query(
    "SELECT * FROM recharge_logs WHERE status = 'failed' AND next_retry_at IS NOT NULL AND next_retry_at <= NOW() LIMIT 20",
    []
  );
  for (const row of rows) {
    // 标记为 pending 避免重复处理
    await db.query("UPDATE recharge_logs SET next_retry_at = NULL WHERE id = ?", [row.id]);
    await execute({
      phoneId: row.phone_id,
      amount: row.amount,
      triggerType: row.trigger_type,
      triggeredBy: 'retry',
      parentLogId: row.parent_log_id || row.id,
      retryCount: row.retry_count + 1,
    });
  }
}

async function getLogs(query = {}) {
  const { page, limit, offset } = parsePagination(query);
  const conditions = [];
  const params = [];
  if (query.phone_id) { conditions.push('phone_id = ?'); params.push(query.phone_id); }
  if (query.status) { conditions.push('status = ?'); params.push(query.status); }
  if (query.trigger_type) { conditions.push('trigger_type = ?'); params.push(query.trigger_type); }
  if (query.from) { conditions.push('created_at >= ?'); params.push(query.from); }
  if (query.to) { conditions.push('created_at <= ?'); params.push(query.to); }
  const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
  const [countRow] = await db.query(`SELECT COUNT(*) AS total FROM recharge_logs ${where}`, params);
  const rows = await db.query(
    `SELECT * FROM recharge_logs ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );
  return paginatedResponse(rows, countRow.total, page, limit);
}

module.exports = { execute, retryFailed, getLogs };
