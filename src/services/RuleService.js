'use strict';
const db = require('../../config/database');

async function list(phoneId = null) {
  if (phoneId) {
    return db.query('SELECT * FROM recharge_rules WHERE phone_id = ? ORDER BY id', [phoneId]);
  }
  return db.query('SELECT * FROM recharge_rules ORDER BY phone_id IS NULL DESC, id', []);
}

async function getById(id) {
  return db.queryOne('SELECT * FROM recharge_rules WHERE id = ?', [id]);
}

async function create(data) {
  const { phone_id = null, rule_name, recharge_amount, trigger_type = 'both', monthly_day = 1, low_balance_threshold = null, max_monthly_recharge = 200 } = data;
  const result = await db.query(
    `INSERT INTO recharge_rules (phone_id, rule_name, recharge_amount, trigger_type, monthly_day, low_balance_threshold, max_monthly_recharge)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [phone_id, rule_name, recharge_amount, trigger_type, monthly_day, low_balance_threshold, max_monthly_recharge]
  );
  return getById(result.insertId);
}

async function update(id, data) {
  const allowed = ['rule_name', 'recharge_amount', 'trigger_type', 'monthly_day', 'low_balance_threshold', 'is_enabled', 'max_monthly_recharge'];
  const updates = [];
  const params = [];
  for (const key of allowed) {
    if (data[key] !== undefined) { updates.push(`${key} = ?`); params.push(data[key]); }
  }
  if (!updates.length) return getById(id);
  params.push(id);
  await db.query(`UPDATE recharge_rules SET ${updates.join(', ')} WHERE id = ?`, params);
  return getById(id);
}

async function remove(id) {
  await db.query('DELETE FROM recharge_rules WHERE id = ?', [id]);
}

async function toggle(id) {
  await db.query('UPDATE recharge_rules SET is_enabled = NOT is_enabled WHERE id = ?', [id]);
  return getById(id);
}

/**
 * 获取某手机号的有效规则（手机号级别优先，否则取全局规则）
 */
async function getEffectiveRule(phoneId) {
  const phoneRule = await db.queryOne(
    "SELECT * FROM recharge_rules WHERE phone_id = ? AND is_enabled = 1 LIMIT 1",
    [phoneId]
  );
  if (phoneRule) return phoneRule;
  return db.queryOne("SELECT * FROM recharge_rules WHERE phone_id IS NULL AND is_enabled = 1 LIMIT 1", []);
}

/**
 * 计算本月已充值金额
 */
async function getMonthlyRechargedAmount(phoneId) {
  const start = new Date();
  start.setDate(1);
  start.setHours(0, 0, 0, 0);
  const [row] = await db.query(
    "SELECT COALESCE(SUM(amount), 0) AS total FROM recharge_logs WHERE phone_id = ? AND status = 'success' AND created_at >= ?",
    [phoneId, start]
  );
  return parseFloat(row.total);
}

module.exports = { list, getById, create, update, remove, toggle, getEffectiveRule, getMonthlyRechargedAmount };
