'use strict';
const { detectCarrier } = require('./carrierDetector');

/**
 * 校验手机号格式（11位，1开头）
 * @param {string} phone
 * @returns {{ valid: boolean, carrier: string|null, error: string|null }}
 */
function validatePhone(phone) {
  if (!phone || typeof phone !== 'string') {
    return { valid: false, carrier: null, error: '手机号不能为空' };
  }
  if (!/^1\d{10}$/.test(phone)) {
    return { valid: false, carrier: null, error: '手机号格式错误，应为11位数字且以1开头' };
  }
  const carrier = detectCarrier(phone);
  if (!carrier) {
    return { valid: false, carrier: null, error: `无法识别运营商，号段 ${phone.slice(0, 3)} 不在已知范围内` };
  }
  return { valid: true, carrier, error: null };
}

module.exports = { validatePhone };
