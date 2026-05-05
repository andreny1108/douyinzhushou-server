'use strict';
const express = require('express');
const router = express.Router();
const PhoneService = require('../services/PhoneService');
const BalanceService = require('../services/BalanceService');
const RechargeService = require('../services/RechargeService');
const RuleService = require('../services/RuleService');

// 列表
router.get('/', async (req, res, next) => {
  try {
    const result = await PhoneService.list(req.query);
    res.json(result);
  } catch (err) { next(err); }
});

// 新增
router.post('/', async (req, res, next) => {
  try {
    const phone = await PhoneService.create(req.body);
    res.status(201).json(phone);
  } catch (err) { next(err); }
});

// 详情
router.get('/:id', async (req, res, next) => {
  try {
    const phone = await PhoneService.getById(req.params.id);
    if (!phone) return res.status(404).json({ error: '手机号不存在' });
    res.json(phone);
  } catch (err) { next(err); }
});

// 修改
router.put('/:id', async (req, res, next) => {
  try {
    const phone = await PhoneService.update(req.params.id, req.body);
    res.json(phone);
  } catch (err) { next(err); }
});

// 删除
router.delete('/:id', async (req, res, next) => {
  try {
    await PhoneService.remove(req.params.id);
    res.json({ success: true });
  } catch (err) { next(err); }
});

// 手动充值
router.post('/:id/recharge', async (req, res, next) => {
  try {
    const { amount } = req.body;
    if (!amount || isNaN(amount) || amount <= 0) return res.status(400).json({ error: '充值金额无效' });
    const result = await RechargeService.execute({
      phoneId: req.params.id,
      amount: parseFloat(amount),
      triggerType: 'manual',
      triggeredBy: req.headers['x-operator'] || 'api',
    });
    res.json(result);
  } catch (err) { next(err); }
});

// 手动查询单号余额
router.post('/:id/query-balance', async (req, res, next) => {
  try {
    const phone = await PhoneService.getById(req.params.id);
    if (!phone) return res.status(404).json({ error: '手机号不存在' });
    const result = await BalanceService.queryOne(phone, 'manual');
    res.json(result);
  } catch (err) { next(err); }
});

// 获取该号码的充值规则
router.get('/:id/rules', async (req, res, next) => {
  try {
    const rules = await RuleService.list(req.params.id);
    res.json(rules);
  } catch (err) { next(err); }
});

module.exports = router;
