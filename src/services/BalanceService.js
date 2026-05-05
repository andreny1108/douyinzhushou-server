'use strict';
const db = require('../../config/database');

function makeLimiter(concurrency) {
  let active = 0;
  const queue = [];
  const next = () => {
    if (active >= concurrency || !queue.length) return;
    active++;
    const { fn, resolve, reject } = queue.shift();
    Promise.resolve().then(fn).then(v => { active--; resolve(v); next(); }).catch(e => { active--; reject(e); next(); });
  };
  return fn => new Promise((resolve, reject) => { queue.push({ fn, resolve, reject }); next(); });
}
const PhoneService = require('./PhoneService');
const AlertService = require('./AlertService');
const AdapterFactory = require('../adapters/AdapterFactory');
const ConfigService = require('./ConfigService');
const logger = require('../utils/logger');
const { parsePagination, paginatedResponse } = require('../utils/pagination');

async function queryOne(phoneRecord, source = 'manual') {
  const adapter = await AdapterFactory.getAdapter();
  const result = await adapter.queryBalance(phoneRecord.phone, phoneRecord.carrier);
  if (result.success && result.balance !== null) {
    await PhoneService.updateBalance(phoneRecord.id, result.balance);
    await db.query(
      'INSERT INTO balance_logs (phone_id, phone, carrier, balance, query_source, adapter_name, raw_response) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [phoneRecord.id, phoneRecord.phone, phoneRecord.carrier, result.balance, source, adapter.name, result.rawResponse]
    );
  }
  return result;
}

async function queryAll(source = 'scheduled') {
  const phones = await PhoneService.listActive();
  const concurrencyStr = await ConfigService.get('balance_query_concurrency');
  const concurrency = parseInt(concurrencyStr || '5', 10);
  const limit = makeLimiter(concurrency);

  const results = await Promise.allSettled(
    phones.map(p => limit(() => queryOne(p, source)))
  );

  const failed = [];
  const succeeded = [];
  results.forEach((r, i) => {
    if (r.status === 'fulfilled' && r.value.success) succeeded.push(phones[i]);
    else failed.push(phones[i]);
  });

  logger.info('批量余额查询完成', { total: phones.length, succeeded: succeeded.length, failed: failed.length });

  // 查询后检测低余额
  const updated = await PhoneService.listActive();
  const lowBalance = updated.filter(p =>
    p.current_balance !== null && p.current_balance < p.low_balance_threshold
  );
  if (lowBalance.length) await AlertService.sendLowBalanceAlert(lowBalance);

  return { total: phones.length, succeeded: succeeded.length, failed: failed.length };
}

async function getHistory(phoneId, query = {}) {
  const { page, limit, offset } = parsePagination(query);
  const conditions = ['phone_id = ?'];
  const params = [phoneId];
  if (query.from) { conditions.push('queried_at >= ?'); params.push(query.from); }
  if (query.to) { conditions.push('queried_at <= ?'); params.push(query.to); }
  const where = conditions.join(' AND ');
  const [countRow] = await db.query(`SELECT COUNT(*) AS total FROM balance_logs WHERE ${where}`, params);
  const rows = await db.query(
    `SELECT id, balance, query_source, adapter_name, queried_at FROM balance_logs WHERE ${where} ORDER BY queried_at DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );
  return paginatedResponse(rows, countRow.total, page, limit);
}

async function getSummary() {
  const [carriers] = await db.query(
    "SELECT carrier, COUNT(*) AS total FROM phone_numbers WHERE status='active' AND deleted_at IS NULL GROUP BY carrier",
    []
  );
  const [low] = await db.query(
    "SELECT COUNT(*) AS total FROM phone_numbers WHERE status='active' AND deleted_at IS NULL AND current_balance IS NOT NULL AND current_balance < low_balance_threshold",
    []
  );
  return { byCarrier: carriers, lowBalanceCount: low.total };
}

module.exports = { queryOne, queryAll, getHistory, getSummary };
