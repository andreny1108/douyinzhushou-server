'use strict';
const crypto = require('crypto');
const env = require('./env');

const ALGORITHM = 'aes-256-gcm';

function getKey() {
  if (!env.CONFIG_ENCRYPTION_KEY) return null;
  return Buffer.from(env.CONFIG_ENCRYPTION_KEY, 'hex');
}

function encrypt(text) {
  const key = getKey();
  if (!key) return text;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString('base64');
}

function decrypt(encoded) {
  const key = getKey();
  if (!key) return encoded;
  const buf = Buffer.from(encoded, 'base64');
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const encrypted = buf.subarray(28);
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  return decipher.update(encrypted) + decipher.final('utf8');
}

module.exports = { encrypt, decrypt };
