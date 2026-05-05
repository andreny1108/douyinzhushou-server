'use strict';
const express = require('express');
const router = express.Router();
const BalanceService = require('../services/BalanceService');

// 批量查询所有余额
router.post('/query-all', async (req, res, next) => {
  try {
    const result = await BalanceService.queryAll('manual');
    res.json(result);
  } catch (err) { next(err); }
});

// 余额历史
router.get('/history/:phoneId', async (req, res, next) => {
  try {
    const result = await BalanceService.getHistory(req.params.phoneId, req.query);
    res.json(result);
  } catch (err) { next(err); }
});

// 汇总
router.get('/summary', async (req, res, next) => {
  try {
    const result = await BalanceService.getSummary();
    res.json(result);
  } catch (err) { next(err); }
});

module.exports = router;
