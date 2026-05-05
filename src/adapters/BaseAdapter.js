'use strict';

/**
 * 运营商适配器基类。所有适配器必须继承此类并实现三个方法。
 *
 * 返回结构化对象而非抛出异常来表达业务级错误（如号码不存在、余额不足）。
 * 只有网络超时或不可恢复的系统错误才允许抛出异常。
 */
class BaseAdapter {
  constructor(config = {}) {
    this.config = config;
    this.name = 'base';
  }

  /**
   * 查询手机号余额
   * @param {string} phone 11位手机号
   * @param {string} carrier 'mobile'|'unicom'|'telecom'
   * @returns {Promise<{success: boolean, balance: number|null, rawResponse: string, errorCode: string|null, errorMessage: string|null}>}
   */
  async queryBalance(phone, carrier) {
    throw new Error(`${this.name}: queryBalance not implemented`);
  }

  /**
   * 发起充值
   * @param {string} phone
   * @param {string} carrier
   * @param {number} amount 充值金额（元）
   * @returns {Promise<{success: boolean, orderId: string|null, rawResponse: string, errorCode: string|null, errorMessage: string|null}>}
   */
  async recharge(phone, carrier, amount) {
    throw new Error(`${this.name}: recharge not implemented`);
  }

  /**
   * 连通性检测
   * @returns {Promise<{ok: boolean, message: string}>}
   */
  async healthCheck() {
    throw new Error(`${this.name}: healthCheck not implemented`);
  }
}

module.exports = BaseAdapter;
