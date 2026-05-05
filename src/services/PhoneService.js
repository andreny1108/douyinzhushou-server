'use strict';
const db = require('../../config/database');
const { validatePhone } = require('../utils/phoneValidator');
const { parsePagination, paginatedResponse } = require('../utils/pagination');

async function list(query = {}) {
  const { page, limit, offset } = parsePagination(query);
  const conditions = ['deleted_at IS NULL'];
  const params = [];

  if (query.carrier) { conditions.push('carrier = ?'); params.push(query.carrier); }
  if (query.status) { conditions.push('status = ?'); params.push(query.status); }
  if (query.owner_id) { conditions.push('owner_id = ?'); params.push(query.owner_id); }
  if (query.low_balance === 'true') {
    conditions.push('current_balance IS NOT NULL AND current_balance < low_balance_threshold');
  }
  if (query.keyword) {
    conditions.push('(phone LIKE ? OR owner_name LIKE ?)');
    params.push(`%${query.keyword}%`, `%${query.keyword}%`);
  }

  const where = conditions.join(' AND ');
  const [countRow] = await db.query(`SELECT COUNT(*) AS total FROM phone_numbers WHERE ${where}`, params);
  const total = countRow.total;
  const rows = await db.query(
    `SELECT * FROM phone_numbers WHERE ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );
  return paginatedResponse(rows, total, page, limit);
}

async function getById(id) {
  return db.queryOne('SELECT * FROM phone_numbers WHERE id = ? AND deleted_at IS NULL', [id]);
}

async function getByPhone(phone) {
  return db.queryOne('SELECT * FROM phone_numbers WHERE phone = ? AND deleted_at IS NULL', [phone]);
}

async function create(data) {
  const { phone, owner_name = '', owner_id = null, label = null, low_balance_threshold = 10.00, notes = null } = data;
  const { valid, carrier, error } = validatePhone(phone);
  if (!valid) throw Object.assign(new Error(error), { statusCode: 400 });

  const existing = await getByPhone(phone);
  if (existing) throw Object.assign(new Error('该手机号已存在'), { statusCode: 409 });

  const result = await db.query(
    `INSERT INTO phone_numbers (phone, carrier, owner_name, owner_id, label, low_balance_threshold, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [phone, carrier, owner_name, owner_id, label, low_balance_threshold, notes]
  );
  return getById(result.insertId);
}

async function update(id, data) {
  const phone = await getById(id);
  if (!phone) throw Object.assign(new Error('手机号不存在'), { statusCode: 404 });

  const allowed = ['owner_name', 'owner_id', 'label', 'low_balance_threshold', 'notes', 'status'];
  const updates = [];
  const params = [];
  for (const key of allowed) {
    if (data[key] !== undefined) { updates.push(`${key} = ?`); params.push(data[key]); }
  }
  if (!updates.length) return phone;
  params.push(id);
  await db.query(`UPDATE phone_numbers SET ${updates.join(', ')} WHERE id = ?`, params);
  return getById(id);
}

async function updateBalance(id, balance) {
  await db.query(
    'UPDATE phone_numbers SET current_balance = ?, last_query_at = NOW() WHERE id = ?',
    [balance, id]
  );
}

async function remove(id) {
  const phone = await getById(id);
  if (!phone) throw Object.assign(new Error('手机号不存在'), { statusCode: 404 });
  await db.query('UPDATE phone_numbers SET deleted_at = NOW(), status = ? WHERE id = ?', ['inactive', id]);
}

async function listActive() {
  return db.query("SELECT * FROM phone_numbers WHERE status = 'active' AND deleted_at IS NULL", []);
}

module.exports = { list, getById, getByPhone, create, update, updateBalance, remove, listActive };
