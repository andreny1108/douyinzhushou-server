'use strict';
const express = require('express');
const router = express.Router();
const RechargeService = require('../services/RechargeService');
const db = require('../../config/database');

// 充值记录列表
router.get('/logs', async (req, res, next) => {
  try {
    const result = await RechargeService.getLogs(req.query);
    res.json(result);
  } catch (err) { next(err); }
});

// 单条记录详情
router.get('/logs/:id', async (req, res, next) => {
  try {
    const row = await db.queryOne('SELECT * FROM recharge_logs WHERE id = ?', [req.params.id]);
    if (!row) return res.status(404).json({ error: '记录不存在' });
    res.json(row);
  } catch (err) { next(err); }
});

// 手动重试失败记录
router.post('/logs/:id/retry', async (req, res, next) => {
  try {
    const row = await db.queryOne('SELECT * FROM recharge_logs WHERE id = ?', [req.params.id]);
    if (!row) return res.status(404).json({ error: '记录不存在' });
    if (row.status !== 'failed') return res.status(400).json({ error: '只能重试失败的记录' });
    const result = await RechargeService.execute({
      phoneId: row.phone_id,
      amount: row.amount,
      triggerType: row.trigger_type,
      triggeredBy: req.headers['x-operator'] || 'api_retry',
      parentLogId: row.parent_log_id || row.id,
      retryCount: row.retry_count + 1,
    });
    res.json(result);
  } catch (err) { next(err); }
});

module.exports = router;
