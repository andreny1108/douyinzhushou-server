'use strict';
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const BaseAdapter = require('./BaseAdapter');

// 聚合数据支持的充值面额（元）
const SUPPORTED_AMOUNTS = [10, 20, 30, 50, 100, 200];

/**
 * 将金额向下取整到最近的支持面额
 */
function normalizeAmount(amount) {
  const supported = SUPPORTED_AMOUNTS.filter(a => a <= amount);
  return supported.length ? supported[supported.length - 1] : null;
}

class JuheAdapter extends BaseAdapter {
  constructor(config = {}) {
    super(config);
    this.name = 'juhe';
    this.balanceKey = config.balanceKey || '';
    this.rechargeKey = config.rechargeKey || '';
    this.timeout = 10000;
  }

  async queryBalance(phone, carrier) {
    try {
      const resp = await axios.get('https://op.juhe.cn/telecom/query', {
        params: { key: this.balanceKey, phone, dtype: 'json' },
        timeout: this.timeout,
      });
      const data = resp.data;
      const raw = JSON.stringify(data);
      if (data.error_code !== 0) {
        return { success: false, balance: null, rawResponse: raw, errorCode: String(data.error_code), errorMessage: data.reason };
      }
      const balance = parseFloat(data.result?.balance ?? data.result?.yue ?? 0);
      return { success: true, balance, rawResponse: raw, errorCode: null, errorMessage: null };
    } catch (err) {
      return { success: false, balance: null, rawResponse: err.message, errorCode: 'NETWORK_ERROR', errorMessage: err.message };
    }
  }

  async recharge(phone, carrier, amount) {
    const normalized = normalizeAmount(amount);
    if (!normalized) {
      return { success: false, orderId: null, rawResponse: '', errorCode: 'INVALID_AMOUNT', errorMessage: `充值金额 ${amount} 元不在支持范围内（最低10元）` };
    }
    const clientOrderId = uuidv4().replace(/-/g, '').slice(0, 32);
    try {
      const resp = await axios.post('https://op.juhe.cn/telecom/charge', null, {
        params: { key: this.rechargeKey, phone, amount: normalized, order_id: clientOrderId, dtype: 'json' },
        timeout: this.timeout,
      });
      const data = resp.data;
      const raw = JSON.stringify(data);
      if (data.error_code !== 0) {
        return { success: false, orderId: null, rawResponse: raw, errorCode: String(data.error_code), errorMessage: data.reason };
      }
      return { success: true, orderId: data.result?.order_id || clientOrderId, rawResponse: raw, errorCode: null, errorMessage: null };
    } catch (err) {
      return { success: false, orderId: null, rawResponse: err.message, errorCode: 'NETWORK_ERROR', errorMessage: err.message };
    }
  }

  async healthCheck() {
    if (!this.balanceKey) {
      return { ok: false, message: 'juhe_balance_api_key 未配置' };
    }
    try {
      const resp = await axios.get('https://op.juhe.cn/telecom/query', {
        params: { key: this.balanceKey, phone: '13800000000', dtype: 'json' },
        timeout: 5000,
      });
      // error_code=10001 表示 key 有效但号码无效，视为连通正常
      const ok = resp.data.error_code === 0 || resp.data.error_code === 10001;
      return { ok, message: ok ? '连通正常' : resp.data.reason };
    } catch (err) {
      return { ok: false, message: err.message };
    }
  }
}

module.exports = JuheAdapter;
