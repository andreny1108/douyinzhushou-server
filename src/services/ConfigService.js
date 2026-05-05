'use strict';
const db = require('../../config/database');
const { encrypt, decrypt } = require('../../config/crypto');

async function get(key) {
  const row = await db.queryOne('SELECT config_value, is_encrypted FROM system_config WHERE config_key = ?', [key]);
  if (!row) return null;
  return row.is_encrypted ? decrypt(row.config_value) : row.config_value;
}

async function getDecrypted(key) {
  return get(key);
}

async function set(key, value, encrypted = false) {
  const stored = encrypted ? encrypt(value) : value;
  await db.query(
    `INSERT INTO system_config (config_key, config_value, is_encrypted) VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE config_value = VALUES(config_value), is_encrypted = VALUES(is_encrypted), updated_at = NOW()`,
    [key, stored, encrypted ? 1 : 0]
  );
}

async function getAll() {
  const rows = await db.query('SELECT config_key, config_value, is_encrypted, description, updated_at FROM system_config ORDER BY config_key', []);
  return rows.map(r => ({
    key: r.config_key,
    value: r.is_encrypted ? '***' : r.config_value,
    isEncrypted: !!r.is_encrypted,
    description: r.description,
    updatedAt: r.updated_at,
  }));
}

module.exports = { get, getDecrypted, set, getAll };
