'use strict';
const BaseAdapter = require('./BaseAdapter');

const CARRIER_LABEL = { mobile: '移动', unicom: '联通', telecom: '电信' };

class MockAdapter extends BaseAdapter {
  constructor(config = {}) {
    super(config);
    this.name = 'mock';
    // 内存中存储余额，方便测试时观察变化
    this._balances = {};
  }

  async queryBalance(phone, carrier) {
    if (!this._balances[phone]) {
      // 首次查询给一个随机余额（5~100元）
      this._balances[phone] = parseFloat((Math.random() * 95 + 5).toFixed(2));
    }
    const balance = this._balances[phone];
    return {
      success: true,
      balance,
      rawResponse: JSON.stringify({ mock: true, phone, carrier: CARRIER_LABEL[carrier], balance }),
      errorCode: null,
      errorMessage: null,
    };
  }

  async recharge(phone, carrier, amount) {
    await new Promise(r => setTimeout(r, 200)); // 模拟网络延迟
    const current = this._balances[phone] || 0;
    this._balances[phone] = parseFloat((current + amount).toFixed(2));
    const orderId = `MOCK-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    return {
      success: true,
      orderId,
      rawResponse: JSON.stringify({ mock: true, phone, amount, orderId, newBalance: this._balances[phone] }),
      errorCode: null,
      errorMessage: null,
    };
  }

  async healthCheck() {
    return { ok: true, message: 'Mock adapter is always healthy' };
  }
}

module.exports = MockAdapter;
